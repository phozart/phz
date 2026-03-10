"""Theme configuration for the phz-grid widget."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class Theme:
    """
    Theme configuration for the grid.

    Parameters
    ----------
    name : str
        Theme name: "light", "dark", "auto", or custom name.
    color_scheme : str
        "light", "dark", or "auto". Default: "auto".
    tokens : dict | None
        Custom CSS token overrides.
    """

    name: str = "auto"
    color_scheme: str = "auto"
    tokens: dict[str, str] | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to JSON-serializable dict."""
        result: dict[str, Any] = {
            "name": self.name,
            "colorScheme": self.color_scheme,
        }
        if self.tokens:
            result["tokens"] = self.tokens
        return result
