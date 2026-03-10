"""Tests for phz_grid.Column."""

from phz_grid import Column


def test_column_defaults():
    col = Column(field="name")
    assert col.field == "name"
    assert col.header is None
    assert col.sortable is True
    assert col.filterable is True
    assert col.editable is False
    assert col.resizable is True
    assert col.priority == 2
    assert col.frozen is None


def test_column_to_dict_minimal():
    col = Column(field="age")
    d = col.to_dict()
    assert d["field"] == "age"
    assert d["sortable"] is True
    assert d["filterable"] is True
    assert d["editable"] is False
    assert d["resizable"] is True
    assert d["priority"] == 2
    assert "header" not in d
    assert "width" not in d
    assert "type" not in d
    assert "frozen" not in d


def test_column_to_dict_full():
    col = Column(
        field="price",
        header="Price",
        width=120,
        min_width=80,
        max_width=200,
        type="currency",
        sortable=False,
        filterable=False,
        editable=True,
        resizable=False,
        frozen="left",
        priority=1,
    )
    d = col.to_dict()
    assert d["field"] == "price"
    assert d["header"] == "Price"
    assert d["width"] == 120
    assert d["minWidth"] == 80
    assert d["maxWidth"] == 200
    assert d["type"] == "currency"
    assert d["sortable"] is False
    assert d["filterable"] is False
    assert d["editable"] is True
    assert d["resizable"] is False
    assert d["frozen"] == "left"
    assert d["priority"] == 1


def test_column_width_string():
    col = Column(field="desc", width="30%")
    d = col.to_dict()
    assert d["width"] == "30%"
