"""Core Grid widget for Jupyter notebooks via anywidget."""

from __future__ import annotations

import json
import pathlib
from typing import Any, Callable

import anywidget
import pyarrow as pa
import pyarrow.ipc as ipc
import traitlets

from phz_grid._column import Column
from phz_grid._theme import Theme

_WIDGET_JS = pathlib.Path(__file__).parent / "static" / "widget.js"
_WIDGET_CSS = pathlib.Path(__file__).parent / "static" / "widget.css"


def _to_arrow_table(data: Any) -> pa.Table:
    """Convert various data formats to an Arrow Table."""
    if isinstance(data, pa.Table):
        return data
    # pandas
    try:
        import pandas as pd

        if isinstance(data, pd.DataFrame):
            return pa.Table.from_pandas(data)
    except ImportError:
        pass
    # polars
    try:
        import polars as pl

        if isinstance(data, pl.DataFrame):
            return data.to_arrow()
    except ImportError:
        pass
    # list of dicts
    if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
        return pa.Table.from_pylist(data)
    raise TypeError(f"Unsupported data type: {type(data)}")


def _arrow_to_ipc_bytes(table: pa.Table) -> bytes:
    """Serialize Arrow table to IPC bytes for zero-copy transfer."""
    sink = pa.BufferOutputStream()
    writer = ipc.new_stream(sink, table.schema)
    writer.write_table(table)
    writer.close()
    return sink.getvalue().to_pybytes()


def _ipc_bytes_to_arrow(data: bytes) -> pa.Table:
    """Deserialize Arrow IPC bytes back to a Table."""
    reader = ipc.open_stream(data)
    return reader.read_all()


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

    _esm = _WIDGET_JS
    _css = _WIDGET_CSS

    # --- Synced traits (Python → JS) ---
    _data_ipc = traitlets.Bytes(b"").tag(sync=True)
    _columns_json = traitlets.Unicode("[]").tag(sync=True)
    _height = traitlets.Unicode("400px").tag(sync=True)
    _theme = traitlets.Unicode("auto").tag(sync=True)
    _selection_mode = traitlets.Unicode("single").tag(sync=True)
    _editable = traitlets.Bool(False).tag(sync=True)
    _sortable = traitlets.Bool(True).tag(sync=True)
    _filterable = traitlets.Bool(True).tag(sync=True)
    _responsive = traitlets.Bool(True).tag(sync=True)
    _pagination = traitlets.Int(0).tag(sync=True)  # 0 = virtual scroll
    _locale = traitlets.Unicode("en-US").tag(sync=True)

    # --- Read-back state (JS → Python) ---
    selected_rows = traitlets.List(traitlets.Int()).tag(sync=True)
    selected_cells = traitlets.List().tag(sync=True)
    sort_state = traitlets.List().tag(sync=True)
    filter_state = traitlets.List().tag(sync=True)
    edit_history = traitlets.List().tag(sync=True)

    # --- Internal ---
    _arrow_table: pa.Table | None = None
    _callbacks: dict[str, list[Callable]] = {}

    def __init__(
        self,
        data: Any = None,
        columns: list[Column] | None = None,
        height: str = "400px",
        theme: str | Theme = "auto",
        selection_mode: str = "single",
        editable: bool = False,
        sortable: bool = True,
        filterable: bool = True,
        responsive: bool = True,
        pagination: int | None = None,
        locale: str = "en-US",
        **kwargs: Any,
    ) -> None:
        super().__init__(**kwargs)
        self._callbacks = {}

        self._height = height
        self._selection_mode = selection_mode
        self._editable = editable
        self._sortable = sortable
        self._filterable = filterable
        self._responsive = responsive
        self._pagination = pagination or 0
        self._locale = locale

        if isinstance(theme, Theme):
            self._theme = json.dumps(theme.to_dict())
        else:
            self._theme = theme

        if columns:
            self._columns_json = json.dumps([c.to_dict() for c in columns])

        if data is not None:
            self.set_data(data)

    def set_data(self, data: Any) -> None:
        """Replace grid data. Serializes to Arrow IPC."""
        self._arrow_table = _to_arrow_table(data)
        self._data_ipc = _arrow_to_ipc_bytes(self._arrow_table)

    def update_rows(self, updates: dict[int, dict[str, Any]]) -> None:
        """Update specific rows by index. Partial updates only."""
        if self._arrow_table is None:
            return
        df = self._arrow_table.to_pandas()
        for idx, values in updates.items():
            for col, val in values.items():
                df.at[idx, col] = val
        self.set_data(df)

    def get_data(self, as_type: str = "pandas") -> Any:
        """
        Get current grid data (with applied sorts/filters).

        Parameters
        ----------
        as_type : str
            "pandas", "polars", or "arrow". Default: "pandas".
        """
        if self._arrow_table is None:
            raise ValueError("No data loaded")
        if as_type == "arrow":
            return self._arrow_table
        if as_type == "polars":
            import polars as pl
            return pl.from_arrow(self._arrow_table)
        return self._arrow_table.to_pandas()

    def get_selected_data(self, as_type: str = "pandas") -> Any:
        """Get data for currently selected rows only."""
        if self._arrow_table is None:
            raise ValueError("No data loaded")
        indices = self.selected_rows
        if not indices:
            return self.get_data(as_type)
        table = self._arrow_table.take(indices)
        if as_type == "arrow":
            return table
        if as_type == "polars":
            import polars as pl
            return pl.from_arrow(table)
        return table.to_pandas()

    def sort(self, column: str, direction: str = "asc") -> None:
        """Programmatically sort by column."""
        self.send({"type": "sort", "column": column, "direction": direction})

    def filter(self, column: str, operator: str, value: Any) -> None:
        """Apply a filter."""
        self.send({"type": "filter", "column": column, "operator": operator, "value": value})

    def clear_filters(self) -> None:
        """Remove all active filters."""
        self.send({"type": "clearFilters"})

    def clear_sort(self) -> None:
        """Remove all active sorts."""
        self.send({"type": "clearSort"})

    def select_rows(self, indices: list[int]) -> None:
        """Programmatically select rows by index."""
        self.send({"type": "selectRows", "indices": indices})

    def deselect_all(self) -> None:
        """Clear all selections."""
        self.send({"type": "deselectAll"})

    def scroll_to_row(self, index: int) -> None:
        """Scroll the grid to bring a specific row into view."""
        self.send({"type": "scrollToRow", "index": index})

    def export_csv(self, path: str | None = None) -> str | None:
        """Export visible data to CSV. Returns string if path is None."""
        if self._arrow_table is None:
            return None
        df = self._arrow_table.to_pandas()
        csv = df.to_csv(index=False)
        if path:
            pathlib.Path(path).write_text(csv)
            return None
        return csv

    def export_state(self) -> dict[str, Any]:
        """Export complete grid state as JSON-serializable dict."""
        return {
            "selected_rows": list(self.selected_rows),
            "sort_state": list(self.sort_state),
            "filter_state": list(self.filter_state),
        }

    def import_state(self, state: dict[str, Any]) -> None:
        """Restore grid state from a previously exported dict."""
        self.send({"type": "importState", "state": state})

    # --- Event Callbacks ---

    def on_selection_change(self, callback: Callable[[list[int]], None]) -> None:
        """Register callback for selection changes."""
        self._callbacks.setdefault("selection", []).append(callback)

    def on_sort_change(self, callback: Callable[[list[dict]], None]) -> None:
        """Register callback for sort state changes."""
        self._callbacks.setdefault("sort", []).append(callback)

    def on_filter_change(self, callback: Callable[[list[dict]], None]) -> None:
        """Register callback for filter state changes."""
        self._callbacks.setdefault("filter", []).append(callback)

    def on_cell_edit(self, callback: Callable[[dict], None]) -> None:
        """Register callback for cell edits."""
        self._callbacks.setdefault("edit", []).append(callback)

    def on_cell_click(self, callback: Callable[[dict], None]) -> None:
        """Register callback for cell clicks."""
        self._callbacks.setdefault("click", []).append(callback)
