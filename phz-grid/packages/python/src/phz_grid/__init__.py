"""
phz-grid — Interactive data grid widget for Jupyter

Usage:
    from phz_grid import Grid, Column, Theme

    grid = Grid(data=df, height="400px")
    grid
"""

from phz_grid._grid import Grid
from phz_grid._column import Column
from phz_grid._theme import Theme

__all__ = ["Grid", "Column", "Theme"]
__version__ = "0.1.0"
