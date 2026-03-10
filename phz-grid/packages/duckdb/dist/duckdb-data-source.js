/**
 * @phozart/phz-duckdb — DuckDB-WASM Data Source Implementation
 *
 * Creates a DuckDB-backed data source that can connect to a grid instance.
 * Uses @duckdb/duckdb-wasm as a peer dependency — at runtime users must
 * have it installed.
 */
import { DuckDBBridge } from './duckdb-bridge.js';
const MS_PER_DAY = 86_400_000;
/**
 * Convert Arrow epoch-day / epoch-ms date values to ISO strings.
 * Arrow's toArray() returns raw numeric values for DATE (epoch-days)
 * and TIMESTAMP (epoch-µs or epoch-ms) columns. This normalises them
 * to human-readable ISO-8601 strings so downstream consumers (grid
 * renderers, formatters) receive consistent string values.
 */
function normaliseDateColumns(data, fields) {
    // Identify columns that need conversion
    const dateFields = [];
    const timestampFields = [];
    for (const f of fields) {
        const typeId = f.type?.typeId;
        if (typeId === 8)
            dateFields.push(f.name); // Arrow Date
        else if (typeId === 10)
            timestampFields.push(f.name); // Arrow Timestamp
    }
    if (dateFields.length === 0 && timestampFields.length === 0)
        return data;
    return data.map((raw) => {
        const row = typeof raw?.toJSON === 'function'
            ? raw.toJSON()
            : { ...raw };
        for (const f of dateFields) {
            const v = row[f];
            if (typeof v === 'number') {
                // epoch-days → ISO date string  (e.g. 19358 → "2023-01-15")
                const d = new Date(v * MS_PER_DAY);
                row[f] = d.toISOString().slice(0, 10);
            }
        }
        for (const f of timestampFields) {
            const v = row[f];
            if (typeof v === 'number') {
                // DuckDB WASM timestamps are typically µs; >1e15 → µs, else ms
                const ms = v > 1e15 ? v / 1000 : v > 1e12 ? v : v * 1000;
                row[f] = new Date(ms).toISOString();
            }
            else if (typeof v === 'bigint') {
                const ms = Number(v) > 1e15 ? Number(v) / 1000 : Number(v);
                row[f] = new Date(ms).toISOString();
            }
        }
        return row;
    });
}
/** Strip characters outside safe SQL identifier set */
function sanitizeIdentifier(name) {
    return name.replace(/[^a-zA-Z0-9_]/g, '_');
}
/** Escape a string for use as a SQL single-quoted literal */
function sanitizeStringLiteral(value) {
    return value.replace(/'/g, "''").replace(/\\/g, '\\\\');
}
/** Map an Arrow field type to a DuckDB SQL type */
function arrowTypeToDuckDB(arrowType) {
    if (arrowType == null)
        return 'VARCHAR';
    const typeObj = arrowType;
    const typeId = typeObj.typeId;
    // Apache Arrow TypeId enum values
    switch (typeId) {
        case 2: // Int (Int8/16/32)
        case 7: // Int64
            return 'BIGINT';
        case 3: // Float (Float16/32/64)
            return 'DOUBLE';
        case 5: // Utf8
            return 'VARCHAR';
        case 6: // Bool
            return 'BOOLEAN';
        case 8: // Date
        case 10: // Timestamp
            return 'TIMESTAMP';
        case 4: // Binary
            return 'BLOB';
        case 9: // Time
            return 'TIME';
        case 11: // Interval
            return 'INTERVAL';
        case 13: // Decimal
            return 'DECIMAL';
        default: {
            // Fallback: try string representation
            const str = String(arrowType).toLowerCase();
            if (str.includes('int'))
                return 'BIGINT';
            if (str.includes('float') || str.includes('double'))
                return 'DOUBLE';
            if (str.includes('bool'))
                return 'BOOLEAN';
            if (str.includes('timestamp') || str.includes('date'))
                return 'TIMESTAMP';
            if (str.includes('decimal'))
                return 'DECIMAL';
            return 'VARCHAR';
        }
    }
}
class DuckDBDataSourceImpl {
    config;
    db = null;
    connection = null;
    connected = false;
    grid = null;
    bridge = null;
    progressHandlers = new Set();
    cancelling = false;
    _hasSharedArrayBuffer = false;
    constructor(config) {
        this.config = config;
    }
    get hasSharedArrayBuffer() {
        return this._hasSharedArrayBuffer;
    }
    async initialize() {
        this._hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
        if (!this._hasSharedArrayBuffer) {
            console.warn('@phozart/phz-duckdb: SharedArrayBuffer not available. ' +
                'Ensure COOP/COEP headers are set for full performance. ' +
                'Falling back to single-threaded mode.');
        }
        // Dynamic import of @duckdb/duckdb-wasm at runtime
        const duckdb = await import('@duckdb/duckdb-wasm');
        const bundle = await duckdb.selectBundle({
            mvp: {
                mainModule: this.config.wasmUrl ?? `${duckdb.PACKAGE_NAME}/dist/duckdb-mvp.wasm`,
                mainWorker: this.config.workerUrl ?? `${duckdb.PACKAGE_NAME}/dist/duckdb-browser-mvp.worker.js`,
            },
            eh: {
                mainModule: this.config.wasmUrl ?? `${duckdb.PACKAGE_NAME}/dist/duckdb-eh.wasm`,
                mainWorker: this.config.workerUrl ?? `${duckdb.PACKAGE_NAME}/dist/duckdb-browser-eh.worker.js`,
            },
        });
        const worker = new Worker(bundle.mainWorker);
        const logger = new duckdb.ConsoleLogger();
        const db = new duckdb.AsyncDuckDB(logger, worker);
        // Must instantiate (load WASM binary) before open
        await db.instantiate(bundle.mainModule);
        const threads = this._hasSharedArrayBuffer
            ? (this.config.threads ? String(this.config.threads) : undefined)
            : '1';
        await db.open({
            path: ':memory:',
            ...(this.config.memoryLimit ? { memory_limit: `${this.config.memoryLimit}MB` } : {}),
            ...(threads ? { threads } : {}),
        });
        this.db = db;
    }
    async connect() {
        if (!this.db) {
            throw new Error('@phozart/phz-duckdb: Call initialize() before connect()');
        }
        this.connection = await this.db.connect();
        this.connected = true;
        return this.connection;
    }
    async disconnect() {
        if (this.connection) {
            await this.connection.close();
            this.connection = null;
        }
        this.connected = false;
    }
    isConnected() {
        return this.connected;
    }
    async loadFile(file, options) {
        this.ensureConnected();
        const tableName = options?.tableName ?? this.inferTableName(file);
        const format = options?.format ?? 'auto';
        const safeTable = sanitizeIdentifier(tableName);
        const resolvedFormat = format === 'auto'
            ? (file instanceof File ? this.inferFormat(file.name) : this.inferFormat(typeof file === 'string' ? file : file.toString()))
            : this.resolveFormat(format);
        // Arrow IPC: parse with apache-arrow (handles both file & stream format),
        // then re-encode as IPC stream for DuckDB WASM's insertArrowFromIPCStream.
        if (resolvedFormat === 'arrow_ipc' && file instanceof File) {
            const originalBuffer = new Uint8Array(await file.arrayBuffer());
            const conn = this.connection;
            if (typeof conn.insertArrowFromIPCStream !== 'function') {
                throw new Error('@phozart/phz-duckdb: insertArrowFromIPCStream not available on this DuckDB WASM connection');
            }
            // Detect format: Arrow IPC file starts with "ARROW1", stream starts with 0xFFFFFFFF
            const isFileFormat = originalBuffer.length >= 6 &&
                originalBuffer[0] === 0x41 && originalBuffer[1] === 0x52 &&
                originalBuffer[2] === 0x52 && originalBuffer[3] === 0x4F &&
                originalBuffer[4] === 0x57 && originalBuffer[5] === 0x31;
            let streamBuffer;
            if (isFileFormat) {
                // Convert Arrow IPC File → Stream format using apache-arrow
                const arrowMod = await import('apache-arrow');
                const arrowTable = arrowMod.tableFromIPC(originalBuffer);
                streamBuffer = arrowMod.tableToIPC(arrowTable, 'stream');
            }
            else {
                // Already in stream format — use directly
                streamBuffer = originalBuffer;
            }
            // insertArrowFromIPCStream transfers the ArrayBuffer to the Worker via postMessage,
            // so we must pass a copy (.slice()) to avoid detaching our buffer.
            await conn.insertArrowFromIPCStream(streamBuffer.slice(), { name: safeTable, create: true });
            // Verify the table was created
            const check = await this.connection.query(`SELECT count(*) as cnt FROM "${safeTable}"`);
            const cnt = Number(check.toArray()[0]?.['cnt'] ?? -1);
            if (cnt < 0) {
                throw new Error(`@phozart/phz-duckdb: Arrow IPC loading failed — table "${safeTable}" was not created`);
            }
            return tableName;
        }
        if (file instanceof File) {
            const buffer = new Uint8Array(await file.arrayBuffer());
            await this.db.registerFileBuffer(file.name, buffer);
            const readFn = sanitizeIdentifier(resolvedFormat);
            const safeFileName = sanitizeStringLiteral(file.name);
            await this.connection.query(`CREATE TABLE "${safeTable}" AS SELECT * FROM read_${readFn}('${safeFileName}'${this.buildLoadOptions(options)})`);
        }
        else {
            const url = file instanceof URL ? file.toString() : file;
            if (url.startsWith('http://') || url.startsWith('https://')) {
                await this.db.registerFileURL(safeTable, url);
            }
            const readFn = sanitizeIdentifier(resolvedFormat);
            const safeUrl = sanitizeStringLiteral(url);
            await this.connection.query(`CREATE TABLE "${safeTable}" AS SELECT * FROM read_${readFn}('${safeUrl}'${this.buildLoadOptions(options)})`);
        }
        return tableName;
    }
    async loadMultipleFiles(files) {
        const tables = [];
        for (const { name, file } of files) {
            const tableName = await this.loadFile(file, { tableName: name });
            tables.push(tableName);
        }
        return tables;
    }
    async getSchema(tableName) {
        this.ensureConnected();
        const name = tableName ?? (await this.getDefaultTable());
        const safeName = sanitizeIdentifier(name);
        const result = await this.connection.query(`DESCRIBE "${safeName}"`);
        const rows = result.toArray();
        const columns = rows.map((row) => ({
            name: String(row['column_name'] ?? row['Field'] ?? ''),
            type: String(row['column_type'] ?? row['Type'] ?? ''),
            nullable: row['null'] !== 'NO',
        }));
        const countResult = await this.connection.query(`SELECT count(*) as cnt FROM "${safeName}"`);
        const countRows = countResult.toArray();
        const rowCount = Number(countRows[0]?.['cnt'] ?? 0);
        return { name, columns, rowCount };
    }
    async getTables() {
        this.ensureConnected();
        const result = await this.connection.query(`SHOW TABLES`);
        const rows = result.toArray();
        return rows.map((r) => String(r['name'] ?? ''));
    }
    async getTableInfo(tableName) {
        const schema = await this.getSchema(tableName);
        // DuckDB doesn't have a direct "table size" query — approximate via PRAGMA
        let sizeBytes = 0;
        try {
            const sizeResult = await this.connection.query(`SELECT pg_size_pretty(estimated_size) as size, estimated_size FROM duckdb_tables() WHERE table_name = '${sanitizeStringLiteral(tableName)}'`);
            const sizeRows = sizeResult.toArray();
            sizeBytes = Number(sizeRows[0]?.['estimated_size'] ?? 0);
        }
        catch {
            // estimated_size not available in all DuckDB versions
        }
        return {
            name: tableName,
            schema,
            sizeBytes,
            rowCount: schema.rowCount,
            columnCount: schema.columns.length,
        };
    }
    async query(sql, params) {
        this.ensureConnected();
        this.cancelling = false;
        const start = performance.now();
        this.notifyProgress({ state: 'executing', progress: 0, rowsProcessed: 0 });
        const result = params && params.length > 0
            ? await this.connection.query(sql, params)
            : await this.connection.query(sql);
        const raw = result.toArray();
        const data = normaliseDateColumns(raw, result.schema.fields);
        const executionTime = performance.now() - start;
        const schema = result.schema.fields.map((f) => ({
            name: f.name,
            type: String(f.type),
            nullable: f.nullable,
        }));
        this.notifyProgress({ state: 'complete', progress: 1, rowsProcessed: data.length });
        return {
            data,
            schema,
            rowCount: data.length,
            executionTime,
            fromCache: false,
        };
    }
    async *queryStream(sql, params) {
        this.ensureConnected();
        this.cancelling = false;
        this.notifyProgress({ state: 'streaming', progress: 0, rowsProcessed: 0 });
        const stream = params && params.length > 0
            ? await this.connection.send(sql, params)
            : await this.connection.send(sql);
        let index = 0;
        let total = 0;
        for await (const batch of stream) {
            if (this.cancelling)
                break;
            const data = batch.toArray();
            total += data.length;
            yield { data, index, total, progress: 0 };
            this.notifyProgress({
                state: 'streaming',
                progress: 0,
                rowsProcessed: total,
            });
            index++;
        }
        this.notifyProgress({ state: 'complete', progress: 1, rowsProcessed: total });
    }
    static ALLOWED_EXECUTE_SQL = /^\s*(SELECT|WITH|EXPLAIN|DESCRIBE|SHOW)\b/i;
    async executeSQL(sql) {
        if (!DuckDBDataSourceImpl.ALLOWED_EXECUTE_SQL.test(sql)) {
            throw new Error('@phozart/phz-duckdb: executeSQL only allows SELECT, WITH, EXPLAIN, DESCRIBE, and SHOW statements.');
        }
        this.ensureConnected();
        await this.connection.query(sql);
    }
    cancelQuery() {
        this.cancelling = true;
        this.connection?.cancelSent();
    }
    onProgress(handler) {
        this.progressHandlers.add(handler);
        return () => { this.progressHandlers.delete(handler); };
    }
    async toArrowTable(tableName) {
        this.ensureConnected();
        const name = tableName ?? (await this.getDefaultTable());
        return this.connection.query(`SELECT * FROM "${sanitizeIdentifier(name)}"`);
    }
    async fromArrowTable(table, tableName) {
        this.ensureConnected();
        const safeTable = sanitizeIdentifier(tableName);
        // BUG-2: Use native Arrow IPC import instead of batch SQL INSERT
        const conn = this.connection;
        if (typeof conn.insertArrowTable === 'function') {
            await conn.insertArrowTable(table, { name: safeTable, create: true });
        }
        else {
            // Fallback for older DuckDB-WASM versions without insertArrowTable
            const data = table.toArray();
            if (data.length === 0) {
                await conn.query(`CREATE TABLE "${safeTable}" AS SELECT 1 WHERE false`);
                return;
            }
            const columns = Object.keys(data[0]);
            const fieldMap = new Map();
            for (const f of table.schema.fields) {
                fieldMap.set(f.name, f);
            }
            const colDefs = columns.map((c) => {
                const field = fieldMap.get(c);
                const duckType = field ? arrowTypeToDuckDB(field.type) : 'VARCHAR';
                return `"${sanitizeIdentifier(c)}" ${duckType}`;
            }).join(', ');
            await conn.query(`CREATE TABLE "${safeTable}" (${colDefs})`);
            const BATCH_SIZE = 1000;
            for (let i = 0; i < data.length; i += BATCH_SIZE) {
                const batch = data.slice(i, i + BATCH_SIZE);
                const valueRows = batch.map((row) => {
                    const values = columns.map((c) => {
                        const v = row[c];
                        return v === null || v === undefined ? 'NULL' : `'${sanitizeStringLiteral(String(v))}'`;
                    }).join(', ');
                    return `(${values})`;
                }).join(', ');
                await conn.query(`INSERT INTO "${safeTable}" VALUES ${valueRows}`);
            }
        }
    }
    getDatabase() {
        if (!this.db)
            throw new Error('@phozart/phz-duckdb: Not initialized');
        return this.db;
    }
    async terminateWorker() {
        await this.disconnect();
        if (this.db) {
            await this.db.terminate();
            this.db = null;
        }
    }
    attachToGrid(grid) {
        this.detachFromGrid();
        this.grid = grid;
        // Wire DuckDBBridge to push query results into the grid (BUG-4)
        this.getDefaultTable().then((tableName) => {
            this.bridge = new DuckDBBridge(this, tableName);
            this.bridge.attach(grid);
            this.bridge.refresh();
        }).catch(() => {
            // No tables loaded yet — bridge will be created when data is loaded
        });
    }
    detachFromGrid() {
        this.bridge?.detach();
        this.bridge = null;
        this.grid = null;
    }
    // --- Private Helpers ---
    ensureConnected() {
        if (!this.connection || !this.connected) {
            throw new Error('@phozart/phz-duckdb: Not connected. Call connect() first.');
        }
    }
    async getDefaultTable() {
        const tables = await this.getTables();
        if (tables.length === 0)
            throw new Error('@phozart/phz-duckdb: No tables loaded');
        return tables[0];
    }
    inferTableName(file) {
        let name;
        if (file instanceof File) {
            name = file.name;
        }
        else if (file instanceof URL) {
            name = file.pathname.split('/').pop() ?? 'data';
        }
        else {
            name = file.split('/').pop() ?? 'data';
        }
        return name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_');
    }
    inferFormat(filename) {
        const ext = filename.split('.').pop()?.toLowerCase() ?? '';
        switch (ext) {
            case 'csv':
            case 'tsv': return 'csv';
            case 'parquet': return 'parquet';
            case 'json':
            case 'jsonl':
            case 'ndjson': return 'json';
            case 'arrow':
            case 'ipc': return 'arrow_ipc';
            default: return 'csv';
        }
    }
    static VALID_FORMATS = new Set([
        'csv', 'parquet', 'json', 'arrow_ipc', 'arrow',
    ]);
    resolveFormat(format) {
        const resolved = format === 'arrow' ? 'arrow_ipc' : format;
        if (!DuckDBDataSourceImpl.VALID_FORMATS.has(format) && !DuckDBDataSourceImpl.VALID_FORMATS.has(resolved)) {
            throw new Error(`@phozart/phz-duckdb: Unsupported file format '${sanitizeIdentifier(format)}'. ` +
                `Allowed: ${[...DuckDBDataSourceImpl.VALID_FORMATS].join(', ')}`);
        }
        return resolved;
    }
    static VALID_COMPRESSION = /^(gzip|zstd|snappy|lz4|none)$/;
    buildLoadOptions(options) {
        if (!options)
            return '';
        const parts = [];
        if (options.header !== undefined)
            parts.push(`header=${options.header}`);
        if (options.delimiter && options.delimiter.length === 1) {
            parts.push(`delim='${sanitizeStringLiteral(options.delimiter)}'`);
        }
        if (options.compression && DuckDBDataSourceImpl.VALID_COMPRESSION.test(options.compression)) {
            parts.push(`compression='${options.compression}'`);
        }
        return parts.length > 0 ? `, ${parts.join(', ')}` : '';
    }
    notifyProgress(progress) {
        for (const handler of this.progressHandlers) {
            handler(progress);
        }
    }
}
export function createDuckDBDataSource(config) {
    return new DuckDBDataSourceImpl(config);
}
/** Validate that SQL is a safe read-only statement before EXPLAIN */
function validateReadOnlySQL(sql) {
    const trimmed = sql.trim().toUpperCase();
    const allowed = ['SELECT ', 'WITH '];
    if (!allowed.some(prefix => trimmed.startsWith(prefix))) {
        throw new Error('@phozart/phz-duckdb: getQueryPlan() only accepts SELECT or WITH statements');
    }
    // Block statement terminators that could chain additional commands
    const stripped = sql.replace(/'[^']*'/g, ''); // remove string literals
    if (stripped.includes(';')) {
        throw new Error('@phozart/phz-duckdb: getQueryPlan() does not allow multiple statements');
    }
}
export async function getQueryPlan(dataSource, sql) {
    validateReadOnlySQL(sql);
    const result = await dataSource.query(`EXPLAIN ${sql}`);
    // DuckDB EXPLAIN returns a single-row result with the plan as text
    const planText = result.data.length > 0 ? String(result.data[0]?.['explain_value'] ?? '') : '';
    return {
        sql,
        plan: [{
                id: 0,
                type: 'root',
                estimatedRows: result.rowCount,
                children: [],
                filter: planText,
            }],
        estimatedCost: result.executionTime,
        estimatedRows: result.rowCount,
    };
}
//# sourceMappingURL=duckdb-data-source.js.map