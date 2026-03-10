"""Column definition for the phz-grid widget."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable


@dataclass
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
    formatter : Callable | str | None
        Python formatter function or format string (e.g., "{:.2f}").
    cell_class : Callable | None
        Function returning CSS class name based on cell value.
    """

    field: str
    header: str | None = None
    width: int | str | None = None
    min_width: int | None = None
    max_width: int | None = None
    type: str | None = None
    sortable: bool = True
    filterable: bool = True
    editable: bool = False
    resizable: bool = True
    frozen: str | None = None
    priority: int = 2
    formatter: Callable[[Any], str] | str | None = None
    cell_class: Callable[[Any], str] | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to JSON-serializable dict for anywidget trait sync."""
        result: dict[str, Any] = {"field": self.field}
        if self.header is not None:
            result["header"] = self.header
        if self.width is not None:
            result["width"] = self.width
        if self.min_width is not None:
            result["minWidth"] = self.min_width
        if self.max_width is not None:
            result["maxWidth"] = self.max_width
        if self.type is not None:
            result["type"] = self.type
        result["sortable"] = self.sortable
        result["filterable"] = self.filterable
        result["editable"] = self.editable
        result["resizable"] = self.resizable
        if self.frozen is not None:
            result["frozen"] = self.frozen
        result["priority"] = self.priority
        return result
