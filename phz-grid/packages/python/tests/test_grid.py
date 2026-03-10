"""Tests for phz_grid.Grid (data conversion and API, not widget rendering)."""

import json

import pandas as pd
import pyarrow as pa
import pytest

from phz_grid import Column, Grid, Theme
from phz_grid._grid import _to_arrow_table, _arrow_to_ipc_bytes, _ipc_bytes_to_arrow


# --- Data conversion tests ---


def test_to_arrow_from_pandas():
    df = pd.DataFrame({"a": [1, 2, 3], "b": ["x", "y", "z"]})
    table = _to_arrow_table(df)
    assert isinstance(table, pa.Table)
    assert table.num_rows == 3
    assert table.column_names == ["a", "b"]


def test_to_arrow_from_arrow():
    original = pa.table({"x": [10, 20]})
    table = _to_arrow_table(original)
    assert table is original


def test_to_arrow_from_list_of_dicts():
    data = [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]
    table = _to_arrow_table(data)
    assert isinstance(table, pa.Table)
    assert table.num_rows == 2
    assert "name" in table.column_names


def test_to_arrow_unsupported_type():
    with pytest.raises(TypeError, match="Unsupported data type"):
        _to_arrow_table("not a dataframe")


def test_ipc_roundtrip():
    table = pa.table({"id": [1, 2, 3], "val": [1.1, 2.2, 3.3]})
    ipc_bytes = _arrow_to_ipc_bytes(table)
    assert isinstance(ipc_bytes, bytes)
    assert len(ipc_bytes) > 0

    restored = _ipc_bytes_to_arrow(ipc_bytes)
    assert restored.num_rows == 3
    assert restored.column("id").to_pylist() == [1, 2, 3]


# --- Grid construction tests ---


def test_grid_with_pandas():
    df = pd.DataFrame({"a": [1, 2], "b": [3, 4]})
    grid = Grid(data=df)
    assert grid._arrow_table is not None
    assert grid._arrow_table.num_rows == 2
    assert len(grid._data_ipc) > 0


def test_grid_with_columns():
    df = pd.DataFrame({"name": ["Alice"], "age": [30]})
    cols = [Column(field="name", header="Name"), Column(field="age", type="number")]
    grid = Grid(data=df, columns=cols)
    parsed = json.loads(grid._columns_json)
    assert len(parsed) == 2
    assert parsed[0]["field"] == "name"
    assert parsed[0]["header"] == "Name"
    assert parsed[1]["type"] == "number"


def test_grid_with_theme_string():
    grid = Grid(theme="dark")
    assert grid._theme == "dark"


def test_grid_with_theme_object():
    theme = Theme(name="custom", tokens={"--phz-bg": "#fff"})
    grid = Grid(theme=theme)
    parsed = json.loads(grid._theme)
    assert parsed["name"] == "custom"
    assert parsed["tokens"]["--phz-bg"] == "#fff"


def test_grid_settings():
    grid = Grid(
        height="500px",
        selection_mode="multi",
        editable=True,
        sortable=False,
        filterable=False,
        responsive=False,
        pagination=50,
        locale="de-DE",
    )
    assert grid._height == "500px"
    assert grid._selection_mode == "multi"
    assert grid._editable is True
    assert grid._sortable is False
    assert grid._filterable is False
    assert grid._responsive is False
    assert grid._pagination == 50
    assert grid._locale == "de-DE"


def test_grid_no_data():
    grid = Grid()
    assert grid._arrow_table is None
    assert grid._data_ipc == b""


# --- Grid methods ---


def test_set_data():
    grid = Grid()
    df = pd.DataFrame({"x": [10, 20, 30]})
    grid.set_data(df)
    assert grid._arrow_table is not None
    assert grid._arrow_table.num_rows == 3


def test_get_data_pandas():
    df = pd.DataFrame({"a": [1, 2]})
    grid = Grid(data=df)
    result = grid.get_data("pandas")
    assert isinstance(result, pd.DataFrame)
    assert list(result["a"]) == [1, 2]


def test_get_data_arrow():
    df = pd.DataFrame({"a": [1]})
    grid = Grid(data=df)
    result = grid.get_data("arrow")
    assert isinstance(result, pa.Table)


def test_get_data_no_data_raises():
    grid = Grid()
    with pytest.raises(ValueError, match="No data loaded"):
        grid.get_data()


def test_get_selected_data_no_selection():
    df = pd.DataFrame({"a": [1, 2, 3]})
    grid = Grid(data=df)
    result = grid.get_selected_data("pandas")
    assert len(result) == 3  # returns all when no selection


def test_get_selected_data_no_data_raises():
    grid = Grid()
    with pytest.raises(ValueError, match="No data loaded"):
        grid.get_selected_data()


def test_export_csv_string():
    df = pd.DataFrame({"name": ["Alice", "Bob"], "age": [30, 25]})
    grid = Grid(data=df)
    csv = grid.export_csv()
    assert "Alice" in csv
    assert "Bob" in csv
    assert "name,age" in csv


def test_export_csv_no_data():
    grid = Grid()
    assert grid.export_csv() is None


def test_export_csv_to_file(tmp_path):
    df = pd.DataFrame({"x": [1, 2]})
    grid = Grid(data=df)
    path = tmp_path / "out.csv"
    result = grid.export_csv(str(path))
    assert result is None
    assert path.exists()
    assert "1" in path.read_text()


def test_export_state():
    grid = Grid()
    state = grid.export_state()
    assert "selected_rows" in state
    assert "sort_state" in state
    assert "filter_state" in state


def test_update_rows():
    df = pd.DataFrame({"name": ["Alice", "Bob"], "age": [30, 25]})
    grid = Grid(data=df)
    grid.update_rows({0: {"age": 31}})
    result = grid.get_data("pandas")
    assert result.at[0, "age"] == 31
    assert result.at[1, "age"] == 25


def test_update_rows_no_data():
    grid = Grid()
    grid.update_rows({0: {"a": 1}})  # should not raise


# --- Event callbacks ---


def test_on_selection_change():
    grid = Grid()
    calls = []
    grid.on_selection_change(lambda rows: calls.append(rows))
    assert "selection" in grid._callbacks
    assert len(grid._callbacks["selection"]) == 1


def test_on_sort_change():
    grid = Grid()
    grid.on_sort_change(lambda s: None)
    assert len(grid._callbacks["sort"]) == 1


def test_on_filter_change():
    grid = Grid()
    grid.on_filter_change(lambda f: None)
    assert len(grid._callbacks["filter"]) == 1


def test_on_cell_edit():
    grid = Grid()
    grid.on_cell_edit(lambda e: None)
    assert len(grid._callbacks["edit"]) == 1


def test_on_cell_click():
    grid = Grid()
    grid.on_cell_click(lambda c: None)
    assert len(grid._callbacks["click"]) == 1


# --- Module API ---


def test_version():
    import phz_grid
    assert phz_grid.__version__ == "0.1.0"


def test_exports():
    import phz_grid
    assert hasattr(phz_grid, "Grid")
    assert hasattr(phz_grid, "Column")
    assert hasattr(phz_grid, "Theme")
