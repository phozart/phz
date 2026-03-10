"""Tests for phz_grid.Theme."""

from phz_grid import Theme


def test_theme_defaults():
    t = Theme()
    assert t.name == "auto"
    assert t.color_scheme == "auto"
    assert t.tokens is None


def test_theme_to_dict_minimal():
    t = Theme()
    d = t.to_dict()
    assert d == {"name": "auto", "colorScheme": "auto"}


def test_theme_to_dict_with_tokens():
    t = Theme(
        name="corporate",
        color_scheme="light",
        tokens={"--phz-header-bg": "#003366", "--phz-row-hover": "#e6f0ff"},
    )
    d = t.to_dict()
    assert d["name"] == "corporate"
    assert d["colorScheme"] == "light"
    assert d["tokens"]["--phz-header-bg"] == "#003366"


def test_theme_dark():
    t = Theme(name="dark", color_scheme="dark")
    d = t.to_dict()
    assert d["name"] == "dark"
    assert d["colorScheme"] == "dark"
    assert "tokens" not in d
