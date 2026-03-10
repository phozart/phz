import { describe, it, expect } from 'vitest';
import {
  parseData,
  buildRowMap,
  buildCoreRowModel,
  filterRows,
  sortRows,
  groupRows,
  flattenRows,
  virtualizeRows,
} from '../row-model.js';
import type { ColumnDefinition } from '../types/column.js';
import type { FilterState, SortState, GroupingState, VirtualizationState } from '../types/state.js';

const sampleData = [
  { name: 'Alice', age: 30, city: 'NYC' },
  { name: 'Bob', age: 25, city: 'LA' },
  { name: 'Charlie', age: 35, city: 'NYC' },
  { name: 'Diana', age: 28, city: 'LA' },
  { name: 'Eve', age: 30, city: 'NYC' },
];

const columns: ColumnDefinition[] = [
  { field: 'name', header: 'Name', type: 'string', sortable: true, filterable: true },
  { field: 'age', header: 'Age', type: 'number', sortable: true, filterable: true },
  { field: 'city', header: 'City', type: 'string', sortable: true, filterable: true },
];

function makeModel() {
  const rows = parseData(sampleData);
  return buildCoreRowModel(rows);
}

// --- Parse Stage ---

describe('parseData', () => {
  it('assigns __id to each row', () => {
    const rows = parseData(sampleData);
    expect(rows).toHaveLength(5);
    for (const row of rows) {
      expect(row.__id).toBeDefined();
    }
  });

  it('uses rowIdField when provided', () => {
    const data = [{ id: 'r1', value: 10 }, { id: 'r2', value: 20 }];
    const rows = parseData(data, 'id');
    expect(rows[0].__id).toBe('r1');
    expect(rows[1].__id).toBe('r2');
  });

  it('generates unique IDs when rowIdField is missing', () => {
    const rows = parseData(sampleData);
    const ids = new Set(rows.map(r => r.__id));
    expect(ids.size).toBe(5);
  });

  it('handles empty array', () => {
    expect(parseData([])).toEqual([]);
  });

  it('preserves original data fields', () => {
    const rows = parseData([{ name: 'Test', value: 42 }]);
    expect(rows[0].name).toBe('Test');
    expect(rows[0].value).toBe(42);
  });
});

describe('buildRowMap', () => {
  it('creates a map keyed by __id', () => {
    const rows = parseData(sampleData);
    const map = buildRowMap(rows);
    expect(map.size).toBe(5);
    for (const row of rows) {
      expect(map.get(row.__id)).toBe(row);
    }
  });
});

describe('buildCoreRowModel', () => {
  it('returns correct structure', () => {
    const rows = parseData(sampleData);
    const model = buildCoreRowModel(rows);
    expect(model.rows).toBe(rows);
    expect(model.flatRows).toBe(rows);
    expect(model.rowCount).toBe(5);
    expect(model.rowsById.size).toBe(5);
  });
});

// --- Filter Stage ---

describe('filterRows', () => {
  const emptyFilter: FilterState = { filters: [], presets: {} };

  it('returns all rows when no filters', () => {
    const model = makeModel();
    const result = filterRows(model, emptyFilter, columns);
    expect(result.rows).toHaveLength(5);
    expect(result.filteredRowIds.size).toBe(5);
  });

  it('filters with equals operator', () => {
    const model = makeModel();
    const result = filterRows(model, {
      filters: [{ field: 'city', operator: 'equals', value: 'NYC' }],
      presets: {},
    }, columns);
    expect(result.rows).toHaveLength(3);
    expect(result.rows.every(r => r.city === 'NYC')).toBe(true);
  });

  it('filters with notEquals operator', () => {
    const model = makeModel();
    const result = filterRows(model, {
      filters: [{ field: 'city', operator: 'notEquals', value: 'NYC' }],
      presets: {},
    }, columns);
    expect(result.rows).toHaveLength(2);
  });

  it('filters with contains operator (case-insensitive)', () => {
    const model = makeModel();
    const result = filterRows(model, {
      filters: [{ field: 'name', operator: 'contains', value: 'ali' }],
      presets: {},
    }, columns);
    expect(result.rows).toHaveLength(1); // Alice
    expect(result.rows[0].name).toBe('Alice');
  });

  it('filters with notContains operator', () => {
    const model = makeModel();
    const result = filterRows(model, {
      filters: [{ field: 'name', operator: 'notContains', value: 'a' }],
      presets: {},
    }, columns);
    expect(result.rows.every(r => !String(r.name).toLowerCase().includes('a'))).toBe(true);
  });

  it('filters with startsWith operator', () => {
    const model = makeModel();
    const result = filterRows(model, {
      filters: [{ field: 'name', operator: 'startsWith', value: 'b' }],
      presets: {},
    }, columns);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe('Bob');
  });

  it('filters with endsWith operator', () => {
    const model = makeModel();
    const result = filterRows(model, {
      filters: [{ field: 'name', operator: 'endsWith', value: 'e' }],
      presets: {},
    }, columns);
    // Alice, Charlie, Eve
    expect(result.rows).toHaveLength(3);
  });

  it('filters with lessThan operator', () => {
    const model = makeModel();
    const result = filterRows(model, {
      filters: [{ field: 'age', operator: 'lessThan', value: 30 }],
      presets: {},
    }, columns);
    expect(result.rows).toHaveLength(2); // Bob(25), Diana(28)
  });

  it('filters with greaterThanOrEqual operator', () => {
    const model = makeModel();
    const result = filterRows(model, {
      filters: [{ field: 'age', operator: 'greaterThanOrEqual', value: 30 }],
      presets: {},
    }, columns);
    expect(result.rows).toHaveLength(3); // Alice(30), Charlie(35), Eve(30)
  });

  it('filters with between operator', () => {
    const model = makeModel();
    const result = filterRows(model, {
      filters: [{ field: 'age', operator: 'between', value: [26, 31] }],
      presets: {},
    }, columns);
    expect(result.rows).toHaveLength(3); // Diana(28), Alice(30), Eve(30)
  });

  it('filters with in operator', () => {
    const model = makeModel();
    const result = filterRows(model, {
      filters: [{ field: 'name', operator: 'in', value: ['Alice', 'Bob'] }],
      presets: {},
    }, columns);
    expect(result.rows).toHaveLength(2);
  });

  it('filters with notIn operator', () => {
    const model = makeModel();
    const result = filterRows(model, {
      filters: [{ field: 'name', operator: 'notIn', value: ['Alice', 'Bob'] }],
      presets: {},
    }, columns);
    expect(result.rows).toHaveLength(3);
  });

  it('filters with isNull / isNotNull', () => {
    const data = [
      { name: 'A', val: null },
      { name: 'B', val: 10 },
      { name: 'C', val: undefined },
    ];
    const rows = parseData(data);
    const model = buildCoreRowModel(rows);
    const cols: ColumnDefinition[] = [
      { field: 'val', header: 'Val', type: 'number', sortable: true, filterable: true },
    ];

    const nullResult = filterRows(model, {
      filters: [{ field: 'val', operator: 'isNull', value: null }],
      presets: {},
    }, cols);
    expect(nullResult.rows).toHaveLength(2);

    const notNullResult = filterRows(model, {
      filters: [{ field: 'val', operator: 'isNotNull', value: null }],
      presets: {},
    }, cols);
    expect(notNullResult.rows).toHaveLength(1);
  });

  it('filters with isEmpty / isNotEmpty', () => {
    const data = [
      { name: '' },
      { name: 'A' },
      { name: null },
    ];
    const rows = parseData(data);
    const model = buildCoreRowModel(rows);
    const cols: ColumnDefinition[] = [
      { field: 'name', header: 'Name', type: 'string', sortable: true, filterable: true },
    ];

    const emptyResult = filterRows(model, {
      filters: [{ field: 'name', operator: 'isEmpty', value: null }],
      presets: {},
    }, cols);
    expect(emptyResult.rows).toHaveLength(2);

    const notEmptyResult = filterRows(model, {
      filters: [{ field: 'name', operator: 'isNotEmpty', value: null }],
      presets: {},
    }, cols);
    expect(notEmptyResult.rows).toHaveLength(1);
  });

  it('applies multiple filters (AND)', () => {
    const model = makeModel();
    const result = filterRows(model, {
      filters: [
        { field: 'city', operator: 'equals', value: 'NYC' },
        { field: 'age', operator: 'greaterThan', value: 30 },
      ],
      presets: {},
    }, columns);
    expect(result.rows).toHaveLength(1); // Charlie(35, NYC)
  });

  it('filters with date operators', () => {
    const data = [
      { event: 'A', date: '2024-01-15' }, // Monday, Jan, Week 3
      { event: 'B', date: '2024-03-20' }, // Wednesday, Mar, Week 12
      { event: 'C', date: '2024-01-22' }, // Monday, Jan, Week 4
    ];
    const rows = parseData(data);
    const model = buildCoreRowModel(rows);
    const cols: ColumnDefinition[] = [
      { field: 'date', header: 'Date', type: 'date', sortable: true, filterable: true },
    ];

    // dateMonth: January = 0
    const janResult = filterRows(model, {
      filters: [{ field: 'date', operator: 'dateMonth', value: [0] }],
      presets: {},
    }, cols);
    expect(janResult.rows).toHaveLength(2);

    // dateYear: 2024
    const yearResult = filterRows(model, {
      filters: [{ field: 'date', operator: 'dateYear', value: [2024] }],
      presets: {},
    }, cols);
    expect(yearResult.rows).toHaveLength(3);
  });

  it('uses valueGetter when defined on column', () => {
    const model = makeModel();
    const colsWithGetter: ColumnDefinition[] = [
      {
        field: 'name',
        header: 'Name',
        type: 'string',
        sortable: true,
        filterable: true,
        valueGetter: (row: any) => row.name.toUpperCase(),
      },
    ];
    const result = filterRows(model, {
      filters: [{ field: 'name', operator: 'equals', value: 'ALICE' }],
      presets: {},
    }, colsWithGetter);
    expect(result.rows).toHaveLength(1);
  });
});

// --- Sort Stage ---

describe('sortRows', () => {
  const emptySort: SortState = { columns: [] };

  it('returns rows unchanged when no sort', () => {
    const model = makeModel();
    const result = sortRows(model, emptySort, columns);
    expect(result.rows.map(r => r.name)).toEqual(['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']);
  });

  it('sorts ascending by string field', () => {
    const model = makeModel();
    const result = sortRows(model, {
      columns: [{ field: 'name', direction: 'asc' }],
    }, columns);
    expect(result.rows.map(r => r.name)).toEqual(['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']);
  });

  it('sorts descending by number field', () => {
    const model = makeModel();
    const result = sortRows(model, {
      columns: [{ field: 'age', direction: 'desc' }],
    }, columns);
    expect(result.rows[0].age).toBe(35);
    expect(result.rows[result.rows.length - 1].age).toBe(25);
  });

  it('multi-column sort', () => {
    const model = makeModel();
    const result = sortRows(model, {
      columns: [
        { field: 'city', direction: 'asc' },
        { field: 'age', direction: 'asc' },
      ],
    }, columns);
    // LA first (sorted by age), then NYC (sorted by age)
    expect(result.rows[0].city).toBe('LA');
    expect(result.rows[0].age).toBe(25); // Bob
    expect(result.rows[1].age).toBe(28); // Diana
    expect(result.rows[2].city).toBe('NYC');
  });

  it('handles null values in sort', () => {
    const data = [
      { name: 'A', val: 10 },
      { name: 'B', val: null },
      { name: 'C', val: 5 },
    ];
    const rows = parseData(data);
    const model = buildCoreRowModel(rows);
    const cols: ColumnDefinition[] = [
      { field: 'val', header: 'Val', type: 'number', sortable: true, filterable: true },
    ];
    const result = sortRows(model, {
      columns: [{ field: 'val', direction: 'asc' }],
    }, cols);
    // null should sort before numbers
    expect(result.rows[0].val).toBeNull();
    expect(result.rows[1].val).toBe(5);
  });

  it('uses custom sortComparator', () => {
    const model = makeModel();
    const colsWithComp: ColumnDefinition[] = [
      {
        field: 'name',
        header: 'Name',
        type: 'string',
        sortable: true,
        filterable: true,
        sortComparator: (a: any, b: any) => b.length - a.length,
      },
    ];
    const result = sortRows(model, {
      columns: [{ field: 'name', direction: 'asc' }],
    }, colsWithComp);
    // Longest name first (Charlie=7), shortest last (Bob=3, Eve=3)
    expect(result.rows[0].name).toBe('Charlie');
  });

  it('provides sortedRowIds', () => {
    const model = makeModel();
    const result = sortRows(model, {
      columns: [{ field: 'age', direction: 'asc' }],
    }, columns);
    expect(result.sortedRowIds).toHaveLength(5);
    expect(result.sortedRowIds[0]).toBe(result.rows[0].__id);
  });

  it('sorts Date objects correctly', () => {
    const data = [
      { name: 'A', date: new Date('2024-03-01') },
      { name: 'B', date: new Date('2024-01-01') },
      { name: 'C', date: new Date('2024-02-01') },
    ];
    const rows = parseData(data);
    const model = buildCoreRowModel(rows);
    const cols: ColumnDefinition[] = [
      { field: 'date', header: 'Date', type: 'date', sortable: true, filterable: true },
    ];
    const result = sortRows(model, {
      columns: [{ field: 'date', direction: 'asc' }],
    }, cols);
    expect(result.rows[0].name).toBe('B'); // Jan
    expect(result.rows[2].name).toBe('A'); // Mar
  });
});

// --- Group Stage ---

describe('groupRows', () => {
  const noGrouping: GroupingState = { groupBy: [], expandedGroups: new Set() };

  it('returns empty groups when no groupBy', () => {
    const model = makeModel();
    const result = groupRows(model, noGrouping);
    expect(result.groups).toEqual([]);
  });

  it('groups by single field', () => {
    const model = makeModel();
    const result = groupRows(model, {
      groupBy: ['city'],
      expandedGroups: new Set(),
    });
    expect(result.groups).toHaveLength(2); // NYC and LA
    const nycGroup = result.groups.find(g => g.value === 'NYC');
    expect(nycGroup).toBeDefined();
    expect(nycGroup!.rows).toHaveLength(3);
    expect(nycGroup!.depth).toBe(0);
  });

  it('groups by multiple fields (nested)', () => {
    const model = makeModel();
    const result = groupRows(model, {
      groupBy: ['city', 'age'],
      expandedGroups: new Set(),
    });
    expect(result.groups).toHaveLength(2);
    const nycGroup = result.groups.find(g => g.value === 'NYC')!;
    expect(nycGroup.subGroups).toBeDefined();
    expect(nycGroup.subGroups!.length).toBeGreaterThan(0);
    expect(nycGroup.subGroups![0].depth).toBe(1);
  });

  it('tracks expanded state via expandedGroups set', () => {
    const model = makeModel();
    const result = groupRows(model, {
      groupBy: ['city'],
      expandedGroups: new Set(['city:NYC']),
    });
    const nycGroup = result.groups.find(g => g.value === 'NYC');
    expect(nycGroup!.isExpanded).toBe(true);
    const laGroup = result.groups.find(g => g.value === 'LA');
    expect(laGroup!.isExpanded).toBe(false);
  });

  it('handles null/undefined group values', () => {
    const data = [
      { name: 'A', category: null },
      { name: 'B', category: 'X' },
      { name: 'C', category: undefined },
    ];
    const rows = parseData(data);
    const model = buildCoreRowModel(rows);
    const result = groupRows(model, {
      groupBy: ['category'],
      expandedGroups: new Set(),
    });
    // null and undefined both map to '(empty)'
    const emptyGroup = result.groups.find(g => g.value === '(empty)');
    expect(emptyGroup).toBeDefined();
    expect(emptyGroup!.rows).toHaveLength(2);
  });
});

// --- Flatten Stage ---

describe('flattenRows', () => {
  it('returns original rows when no groups', () => {
    const model = makeModel();
    const grouped = groupRows(model, { groupBy: [], expandedGroups: new Set() });
    const result = flattenRows(grouped);
    expect(result.flatRows).toBe(model.rows);
  });

  it('includes only expanded group rows', () => {
    const model = makeModel();
    const grouped = groupRows(model, {
      groupBy: ['city'],
      expandedGroups: new Set(['city:NYC']),
    });
    const result = flattenRows(grouped);
    expect(result.flatRows).toHaveLength(3); // Only NYC rows
    expect(result.flatRows.every(r => r.city === 'NYC')).toBe(true);
  });

  it('returns empty when no groups expanded', () => {
    const model = makeModel();
    const grouped = groupRows(model, {
      groupBy: ['city'],
      expandedGroups: new Set(),
    });
    const result = flattenRows(grouped);
    expect(result.flatRows).toHaveLength(0);
  });

  it('flattens nested groups recursively', () => {
    const model = makeModel();
    const grouped = groupRows(model, {
      groupBy: ['city', 'age'],
      expandedGroups: new Set(['city:NYC', 'age:30']),
    });
    const result = flattenRows(grouped);
    // Only NYC > age 30 rows (Alice, Eve)
    expect(result.flatRows).toHaveLength(2);
  });
});

// --- Virtualize Stage ---

describe('virtualizeRows', () => {
  const disabled: VirtualizationState = {
    enabled: false,
    estimatedRowHeight: 40,
    overscan: 5,
    totalHeight: 0,
    visibleRange: [0, 0],
  };

  const enabled: VirtualizationState = {
    enabled: true,
    estimatedRowHeight: 40,
    overscan: 2,
    totalHeight: 0,
    visibleRange: [0, 0],
  };

  it('returns all rows when virtualization disabled', () => {
    const model = makeModel();
    const result = virtualizeRows(model, disabled, 0, 400);
    expect(result.visibleRows).toBe(model.flatRows);
    expect(result.startIndex).toBe(0);
    expect(result.totalHeight).toBe(5 * 40);
  });

  it('slices visible rows based on scroll position', () => {
    // Create a larger dataset
    const bigData = Array.from({ length: 100 }, (_, i) => ({ name: `Row ${i}`, age: i }));
    const rows = parseData(bigData);
    const model = buildCoreRowModel(rows);

    const result = virtualizeRows(model, enabled, 800, 400); // scroll 800px, viewport 400px
    // rawStart = 800/40 = 20, start = 20 - 2 = 18
    // visibleCount = 400/40 = 10, rawEnd = 20 + 10 = 30, end = 30 + 2 = 32
    expect(result.startIndex).toBe(18);
    expect(result.endIndex).toBe(32);
    expect(result.visibleRows).toHaveLength(15); // 18..32 inclusive
    expect(result.offsetTop).toBe(18 * 40);
    expect(result.totalHeight).toBe(100 * 40);
  });

  it('clamps to bounds', () => {
    const rows = parseData(sampleData);
    const model = buildCoreRowModel(rows);
    const result = virtualizeRows(model, enabled, 0, 1000);
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(4);
    expect(result.visibleRows).toHaveLength(5);
  });
});
