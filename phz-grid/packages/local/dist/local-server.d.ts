/**
 * @phozart/phz-local — Local Server
 *
 * Lightweight local Node.js server for the phz-grid workspace.
 * Binds to localhost only, serves workspace API endpoints,
 * and manages filesystem-backed persistence.
 */
export interface LocalServerConfig {
    port?: number;
    dataDir?: string;
    openBrowser?: boolean;
    watchDir?: string;
    cors?: boolean;
}
export interface LocalServer {
    start(): Promise<void>;
    stop(): Promise<void>;
    getPort(): number;
    getDataDir(): string;
}
export declare function resolveConfig(config?: Partial<LocalServerConfig>): Required<LocalServerConfig>;
export declare function createLocalServer(config?: LocalServerConfig): Promise<LocalServer>;
//# sourceMappingURL=local-server.d.ts.map