# PYTHON API CONTRACTS — @phozart/python

> pip package: `phz-grid`
> Distribution: PyPI
> Python: >=3.9
> Tier: MIT (all features)

**Date**: 2026-02-24
**Status**: BINDING — implementation must follow these signatures

---

## Overview

The Python package wraps phz-grid's JavaScript core as a Jupyter widget via
`anywidget`, with additional adapters for Panel and Streamlit. Data flows via
Apache Arrow IPC for zero-copy transfer between Python and the browser.

### Architecture

```
Python (pandas/polars/pyarrow)
    │
    ├─ Arrow IPC serialization (zero-copy)
    │
    ▼
anywidget trait sync
    │
    ▼
Browser JS (@phozart/grid + @phozart/core)
    │
    ├─ Arrow JS deserialization
    │
    ▼
Grid renders in Jupyter / Panel / Streamlit
```

### Dependencies

```toml
[project]
name = "phz-grid"
requires-python = ">=3.9"
dependencies = [
    "anywidget>=0.9.0",
    "traitlets>=5.0",
    "pyarrow>=14.0",
    "pandas>=2.0",
]

[project.optional-dependencies]
polars = ["polars>=0.20"]
panel = ["panel>=1.3"]
streamlit = ["streamlit>=1.30"]
extras = [
    "phz-grid-extras",  # DuckDB, AI, and collaboration features
]
```

---

## Package 10: phz-grid (PyPI)

### Core Widget

```python
from phz_grid import Grid, Column, Theme

class Grid(anywidget.Widget):
    """
    Interactive data grid widget for Jupyter notebooks.

    Parameters
    ----------
    data : pd.DataFrame | pl.DataFrame | pa.Table | list[dict]
        The data to display. Converted to Arrow IPC internally.
    columns : list[Column] | None
        Column definitions. Auto-inferred from data if omitted.
    height : str
        CSS height of the grid. Default: "400px".
    theme : str | Theme
        Theme name ("light", "dark", "auto") or Theme object.
    selection_mode : str
        "single", "multi", or "range". Default: "single".
    editable : bool
        Enable inline cell editing. Default: False.
    sortable : bool
        Enable column sorting. Default: True.
    filterable : bool
        Enable column filtering. Default: True.
    responsive : bool
        Enable container query responsive layout. Default: True.
    pagination : int | None
        Rows per page. None for virtual scrolling. Default: None.
    locale : str
        BCP 47 locale string. Default: "en-US".
    """

    # --- Properties (synced with JS via anywidget) ---
    data: traitlets.Any          # Arrow IPC bytes
    columns: traitlets.List      # Column definitions as dicts
    height: traitlets.Unicode    # CSS height
    theme: traitlets.Unicode     # Theme name or JSON
    selection_mode: traitlets.Unicode
    editable: traitlets.Bool
    sortable: traitlets.Bool
    filterable: traitlets.Bool
    responsive: traitlets.Bool
    pagination: traitlets.Int
    locale: traitlets.Unicode

    # --- Read-back state (JS → Python) ---
    selected_rows: traitlets.List    # List of row indices
    selected_cells: traitlets.List   # List of (row, col) tuples
    sort_state: traitlets.List       # Active sorts
    filter_state: traitlets.List     # Active filters
    edit_history: traitlets.List     # List of edit operations

    # --- Methods ---

    def set_data(
        self,
        data: "pd.DataFrame | pl.DataFrame | pa.Table | list[dict]",
    ) -> None:
        """Replace grid data. Serializes to Arrow IPC."""
        ...

    def update_rows(
        self,
        updates: dict[int, dict[str, Any]],
    ) -> None:
        """Update specific rows by index. Partial updates only."""
        ...

    def get_data(
        self,
        as_type: str = "pandas",
    ) -> "pd.DataFrame | pl.DataFrame | pa.Table":
        """
        Get current grid data (with applied sorts/filters).

        Parameters
        ----------
        as_type : str
            "pandas", "polars", or "arrow". Default: "pandas".
        """
        ...

    def get_selected_data(
        self,
        as_type: str = "pandas",
    ) -> "pd.DataFrame | pl.DataFrame | pa.Table":
        """Get data for currently selected rows only."""
        ...

    def sort(
        self,
        column: str,
        direction: str = "asc",
    ) -> None:
        """Programmatically sort by column. direction: "asc" | "desc" | None."""
        ...

    def filter(
        self,
        column: str,
        operator: str,
        value: Any,
    ) -> None:
        """
        Apply a filter.

        Operators: "equals", "notEquals", "contains", "startsWith",
        "endsWith", "greaterThan", "lessThan", "between", "in",
        "isEmpty", "isNotEmpty", "regex".
        """
        ...

    def clear_filters(self) -> None:
        """Remove all active filters."""
        ...

    def clear_sort(self) -> None:
        """Remove all active sorts."""
        ...

    def select_rows(self, indices: list[int]) -> None:
        """Programmatically select rows by index."""
        ...

    def deselect_all(self) -> None:
        """Clear all selections."""
        ...

    def scroll_to_row(self, index: int) -> None:
        """Scroll the grid to bring a specific row into view."""
        ...

    def export_csv(self, path: str | None = None) -> str | None:
        """Export visible data to CSV. Returns string if path is None."""
        ...

    def export_state(self) -> dict:
        """Export complete grid state as JSON-serializable dict."""
        ...

    def import_state(self, state: dict) -> None:
        """Restore grid state from a previously exported dict."""
        ...

    # --- Event Callbacks ---

    def on_selection_change(
        self,
        callback: Callable[[list[int]], None],
    ) -> None:
        """Register callback for selection changes."""
        ...

    def on_sort_change(
        self,
        callback: Callable[[list[dict]], None],
    ) -> None:
        """Register callback for sort state changes."""
        ...

    def on_filter_change(
        self,
        callback: Callable[[list[dict]], None],
    ) -> None:
        """Register callback for filter state changes."""
        ...

    def on_cell_edit(
        self,
        callback: Callable[[dict], None],
    ) -> None:
        """
        Register callback for cell edits.
        Payload: {"row": int, "column": str, "old_value": Any, "new_value": Any}
        """
        ...

    def on_cell_click(
        self,
        callback: Callable[[dict], None],
    ) -> None:
        """
        Register callback for cell clicks.
        Payload: {"row": int, "column": str, "value": Any}
        """
        ...
```

### Column Definition

```python
from phz_grid import Column

class Column:
    """
    Column definition for the grid.

    Parameters
    ----------
    field : str
        Data field name (must match DataFrame column name).
    header : str | None
        Display header text. Default: field name title-cased.
    width : int | str | None
        Column width in px or CSS string. Default: auto.
    min_width : int | None
        Minimum column width in px.
    max_width : int | None
        Maximum column width in px.
    type : str | None
        Data type hint: "text", "number", "date", "boolean", "currency".
        Auto-inferred from DataFrame dtype if omitted.
    sortable : bool
        Allow sorting. Default: True.
    filterable : bool
        Allow filtering. Default: True.
    editable : bool
        Allow inline editing. Default: False.
    resizable : bool
        Allow column resize. Default: True.
    frozen : str | None
        Pin column: "left", "right", or None.
    priority : int
        Responsive priority (1=always visible, 2=tablet+, 3=desktop only).
        Default: 2.
    formatter : Callable[[Any], str] | str | None
        Python formatter function or format string (e.g., "{:.2f}").
    cell_class : Callable[[Any], str] | None
        Function returning CSS class name based on cell value.
    """
    ...
```

### Theme Configuration

```python
from phz_grid import Theme

class Theme:
    """
    Custom theme configuration.

    Parameters
    ----------
    name : str
        Theme identifier.
    color_scheme : str
        "light", "dark", or "auto". Default: "auto".
    tokens : dict[str, str] | None
        CSS custom property overrides.
        Keys are token names (e.g., "phz-color-primary").
        Values are CSS values (e.g., "#3b82f6").
    """
    ...

# Prebuilt themes
THEMES = {
    "light": Theme(name="light", color_scheme="light"),
    "dark": Theme(name="dark", color_scheme="dark"),
    "material": Theme(name="material", color_scheme="auto"),
    "bootstrap": Theme(name="bootstrap", color_scheme="auto"),
}
```

---

## Usage Examples

### Basic Jupyter Usage

```python
from phz_grid import Grid
import pandas as pd

df = pd.read_csv("sales.csv")
grid = Grid(data=df, height="500px", theme="dark")
grid  # renders interactive grid in Jupyter cell
```

### With Column Definitions

```python
from phz_grid import Grid, Column

grid = Grid(
    data=df,
    columns=[
        Column("name", header="Customer Name", frozen="left"),
        Column("revenue", type="currency", formatter="${:,.2f}"),
        Column("date", type="date", sortable=True),
        Column("status", filterable=True, priority=1),
    ],
    selection_mode="multi",
    editable=True,
)
```

### Event Handling

```python
grid = Grid(data=df)

@grid.on_selection_change
def handle_selection(selected_indices):
    selected_df = df.iloc[selected_indices]
    print(f"Selected {len(selected_df)} rows")

@grid.on_cell_edit
def handle_edit(event):
    print(f"Row {event['row']}, Col {event['column']}: "
          f"{event['old_value']} → {event['new_value']}")
```

### Polars Support

```python
import polars as pl
from phz_grid import Grid

df = pl.read_parquet("large_dataset.parquet")
grid = Grid(data=df)  # zero-copy via Arrow

# Get filtered data back as Polars
filtered = grid.get_selected_data(as_type="polars")
```

### Panel Integration

```python
import panel as pn
from phz_grid import Grid

pn.extension("ipywidget")

df = pd.read_csv("data.csv")
grid = Grid(data=df, height="600px")

app = pn.Column(
    "## Data Explorer",
    pn.pane.IPyWidget(grid),
    pn.bind(lambda sel: f"Selected: {len(sel)} rows", grid.param.selected_rows),
)
app.servable()
```

### Streamlit Integration

```python
import streamlit as st
from phz_grid.streamlit import grid_component

df = pd.read_csv("data.csv")
result = grid_component(
    data=df,
    height="500px",
    selection_mode="multi",
    key="my_grid",
)

if result["selected_rows"]:
    st.write(f"Selected {len(result['selected_rows'])} rows")
```

---

## Extended Python Package: phz-grid-extras

```
pip install phz-grid-extras
```

Extends the base Grid with DuckDB, AI, and collaboration features.

```python
from phz_grid.extras import ExtendedGrid, DuckDBSource, AIToolkit

class ExtendedGrid(Grid):
    """
    Extended grid with DuckDB, AI, and collaboration features.

    Additional Parameters
    ----------
    data_source : DuckDBSource | None
        DuckDB-WASM data source for SQL queries.
    ai : AIToolkit | None
        AI toolkit configuration.
    collaboration : CollabConfig | None
        Real-time collaboration configuration.
    """

    # --- DuckDB Integration ---

    def query(self, sql: str) -> "pd.DataFrame":
        """Execute SQL query against the loaded data using DuckDB-WASM."""
        ...

    def load_file(
        self,
        path: str,
        format: str = "auto",  # "csv", "parquet", "json", or "auto"
    ) -> None:
        """Load a file into DuckDB-WASM for querying."""
        ...

    # --- AI Features ---

    def ask(self, question: str) -> "pd.DataFrame":
        """
        Natural language query. Translates to SQL, executes, returns results.

        Example:
            grid.ask("Show me all customers in California with revenue > 10000")
        """
        ...

    def detect_anomalies(
        self,
        columns: list[str] | None = None,
    ) -> "pd.DataFrame":
        """Flag anomalous values in specified columns."""
        ...

    def summarize(self) -> str:
        """Generate plain-English summary of the current data."""
        ...

    # --- Collaboration ---

    def start_session(self, room_id: str | None = None) -> str:
        """Start a collaboration session. Returns shareable room URL."""
        ...

    def join_session(self, room_url: str) -> None:
        """Join an existing collaboration session."""
        ...

    def end_session(self) -> None:
        """End the current collaboration session."""
        ...
```

### Extended Usage

```python
from phz_grid.extras import ExtendedGrid

grid = ExtendedGrid(
    height="600px",
    theme="dark",
)

# Load and query Parquet files with SQL
grid.load_file("sales_2025.parquet")
grid.query("SELECT region, SUM(revenue) FROM sales GROUP BY region ORDER BY 2 DESC")

# Natural language queries
grid.ask("What were the top 10 products by revenue last quarter?")

# Anomaly detection
anomalies = grid.detect_anomalies(columns=["price", "quantity"])

# Collaboration
url = grid.start_session()
print(f"Share this URL: {url}")
```

---

## Streamlit Component API

```python
# phz_grid/streamlit.py

def grid_component(
    data: "pd.DataFrame | pl.DataFrame | pa.Table",
    columns: list[Column] | None = None,
    height: str = "400px",
    theme: str | Theme = "auto",
    selection_mode: str = "single",
    editable: bool = False,
    sortable: bool = True,
    filterable: bool = True,
    key: str | None = None,
) -> dict:
    """
    Streamlit component for phz-grid.

    Returns
    -------
    dict with keys:
        - "selected_rows": list[int]
        - "sort_state": list[dict]
        - "filter_state": list[dict]
        - "edits": list[dict]  (if editable)
    """
    ...
```

---

## Internal Architecture

### Data Serialization Path

```
Python DataFrame
    │
    ├── pandas → pa.Table.from_pandas(df)
    ├── polars → df.to_arrow()
    └── dict[] → pa.Table.from_pylist(data)
    │
    ▼
pa.Table
    │
    ├── Arrow IPC serialization: sink = pa.BufferOutputStream()
    │   writer = pa.ipc.new_stream(sink, table.schema)
    │   writer.write_table(table)
    │
    ▼
bytes (Arrow IPC stream)
    │
    ├── anywidget binary trait sync (WebSocket)
    │
    ▼
Browser JS: arrow.tableFromIPC(bytes)
    │
    ▼
@phozart/core data model
```

### File Structure

```
packages/python/
  ├── pyproject.toml           # PEP 621 project metadata
  ├── src/
  │   └── phz_grid/
  │       ├── __init__.py       # Grid, Column, Theme exports
  │       ├── _widget.py        # anywidget Grid implementation
  │       ├── _column.py        # Column definition class
  │       ├── _theme.py         # Theme configuration
  │       ├── _serialization.py # Arrow IPC serialization helpers
  │       ├── _js/
  │       │   └── widget.js     # Bundled JS (grid + core)
  │       ├── extras/
  │       │   ├── __init__.py   # ExtendedGrid
  │       │   ├── _duckdb.py    # DuckDB integration
  │       │   ├── _ai.py        # AI toolkit
  │       │   └── _collab.py    # Collaboration
  │       ├── streamlit/
  │       │   └── __init__.py   # Streamlit component
  │       └── panel/
  │           └── __init__.py   # Panel adapter
  └── tests/
      ├── test_grid.py
      ├── test_column.py
      ├── test_serialization.py
      └── test_extras.py
```

---

## v15 JavaScript Changes — Python Impact Assessment

The v15 architecture refactoring introduced three new JavaScript packages
(`@phozart/shared`, `@phozart/viewer`, `@phozart/editor`), four
spec amendments (alert-aware widgets, micro-widget cell renderers, impact chain
widget, faceted attention filtering), and new engine subsystems (personal alerts,
subscriptions, usage analytics, OpenAPI generator, attention system).

**These changes do NOT affect the Python API surface.**

The Python package (`phz-grid` on PyPI) wraps the JavaScript grid core via
`anywidget` and communicates through Arrow IPC binary trait sync. The v15
changes are entirely within the JavaScript BI/dashboard/admin layer, which the
Python package does not expose. Specifically:

- The `Grid` widget class API is unchanged
- The `Column` definition API is unchanged
- The Arrow IPC serialization path is unchanged
- The `ExtendedGrid` extras (DuckDB, AI, collaboration) are unchanged
- The Streamlit and Panel adapters are unchanged

If future Python integration is desired for the new v15 capabilities (e.g.,
rendering alert-aware KPI cards in Jupyter, or managing subscriptions from
Python), that would require a new `phz-grid-bi` extras package — but this is
not currently planned.

---

*API Contracts — @phozart/python*
*Phase 2: Architecture & Data Design*
*2026-02-24 (v15 note added 2026-03-08)*
