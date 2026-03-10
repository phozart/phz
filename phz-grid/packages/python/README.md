# phz-grid (Python)

Interactive data grid widget for Jupyter notebooks. Built on anywidget with Apache Arrow IPC for zero-copy data transfer. Supports pandas, Polars, and PyArrow DataFrames.

## Installation

```bash
pip install phz-grid
```

Optional dependencies:

```bash
pip install phz-grid[polars]     # Polars support
pip install phz-grid[panel]      # Panel integration
pip install phz-grid[streamlit]  # Streamlit integration
```

## Quick Start

```python
from phz_grid import Grid, Column, Theme
import pandas as pd

df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Carol', 'Dave'],
    'age': [30, 25, 35, 28],
    'department': ['Engineering', 'Sales', 'Engineering', 'Marketing'],
    'salary': [95000, 65000, 105000, 72000],
})

# Basic grid — columns are auto-inferred
grid = Grid(data=df, height='400px')
grid
```

## Configuration

```python
grid = Grid(
    data=df,
    columns=[
        Column(field='name', header='Name', type='string'),
        Column(field='age', header='Age', type='number', width=80),
        Column(field='salary', header='Salary', type='number', format='currency'),
    ],
    height='500px',
    theme='dark',               # 'light', 'dark', or 'auto'
    selection_mode='multi',     # 'single', 'multi', or 'range'
    editable=True,              # Enable inline editing
    sortable=True,              # Enable column sorting
    filterable=True,            # Enable column filtering
    responsive=True,            # Enable responsive layout
    pagination=50,              # Rows per page (None for virtual scroll)
    locale='en-US',             # BCP 47 locale
)
```

## Theming

```python
from phz_grid import Theme

theme = Theme(
    primary='#2563eb',
    surface='#ffffff',
    text='#1e293b',
    font_family='Inter, sans-serif',
    border_radius='6px',
)

grid = Grid(data=df, theme=theme)
```

## Data Formats

The grid accepts multiple data formats:

```python
# pandas DataFrame
grid = Grid(data=pd.DataFrame(...))

# Polars DataFrame
import polars as pl
grid = Grid(data=pl.DataFrame(...))

# PyArrow Table
import pyarrow as pa
grid = Grid(data=pa.table(...))

# List of dicts
grid = Grid(data=[{'name': 'Alice', 'age': 30}, ...])
```

## Programmatic Operations

### Data

```python
# Replace data
grid.set_data(new_df)

# Get current data
df = grid.get_data()                     # as pandas
df = grid.get_data(as_type='polars')     # as Polars
table = grid.get_data(as_type='arrow')   # as Arrow

# Get selected rows
selected_df = grid.get_selected_data()

# Update specific rows
grid.update_rows({0: {'salary': 100000}, 2: {'department': 'Product'}})
```

### Sorting & Filtering

```python
grid.sort('salary', 'desc')
grid.clear_sort()

grid.filter('department', 'equals', 'Engineering')
grid.clear_filters()
```

### Selection

```python
grid.select_rows([0, 2, 3])
grid.deselect_all()
grid.scroll_to_row(50)
```

### State

```python
# Export/import state
state = grid.export_state()
grid.import_state(state)
```

### Export

```python
# Export to CSV
csv_string = grid.export_csv()
grid.export_csv('output.csv')  # Save to file
```

## Event Callbacks

```python
def on_select(selected_indices):
    print(f'Selected: {selected_indices}')

grid.on_selection_change(on_select)
grid.on_sort_change(lambda sorts: print(f'Sort: {sorts}'))
grid.on_filter_change(lambda filters: print(f'Filters: {filters}'))
grid.on_cell_edit(lambda edit: print(f'Edited: {edit}'))
grid.on_cell_click(lambda click: print(f'Clicked: {click}'))
```

## Read-back State

These traits are automatically synced from the JavaScript widget:

```python
grid.selected_rows    # list[int] — selected row indices
grid.selected_cells   # list — selected cell positions
grid.sort_state       # list — active sort configuration
grid.filter_state     # list — active filter configuration
grid.edit_history     # list — edit change log
```

## Requirements

- Python >= 3.9
- anywidget >= 0.9.0
- traitlets >= 5.0
- pyarrow >= 14.0
- pandas >= 2.0

## License

MIT
