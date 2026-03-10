/**
 * phz-grid — anywidget JavaScript entry point
 *
 * This module is loaded by anywidget in the browser (Jupyter/Panel/Streamlit).
 * It creates a <phz-grid> element and syncs data via Arrow IPC.
 */

// Import from the bundled phz-grid packages
// In production, this would import from the built @phozart/grid bundle
// For now, we define the widget interface for anywidget

export function render({ model, el }) {
  // Create the grid container
  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = model.get('_height') || '400px';
  el.appendChild(container);

  // Create the phz-grid element
  const grid = document.createElement('phz-grid');
  grid.setAttribute('selection-mode', model.get('_selection_mode') || 'single');
  grid.setAttribute('edit-mode', model.get('_editable') ? 'dblclick' : 'none');
  grid.setAttribute('theme', model.get('_theme') || 'auto');
  grid.setAttribute('locale', model.get('_locale') || 'en-US');
  grid.style.width = '100%';
  grid.style.height = '100%';
  container.appendChild(grid);

  // --- Data sync (Arrow IPC) ---
  function updateData() {
    const ipcBytes = model.get('_data_ipc');
    if (!ipcBytes || ipcBytes.byteLength === 0) return;

    // Decode Arrow IPC to row data
    // In production this uses apache-arrow JS to deserialize
    try {
      if (typeof window.Apache !== 'undefined' && window.Apache.Arrow) {
        const table = window.Apache.Arrow.tableFromIPC(ipcBytes);
        const rows = [];
        for (let i = 0; i < table.numRows; i++) {
          const row = {};
          for (const field of table.schema.fields) {
            row[field.name] = table.getChild(field.name).get(i);
          }
          rows.push(row);
        }
        grid.data = rows;
      }
    } catch (err) {
      console.warn('[phz-grid] Arrow IPC decode error:', err);
    }
  }

  // --- Column sync ---
  function updateColumns() {
    const columnsJson = model.get('_columns_json');
    if (columnsJson) {
      try {
        grid.columns = JSON.parse(columnsJson);
      } catch {
        // skip invalid JSON
      }
    }
  }

  // --- Property sync ---
  function syncProperties() {
    container.style.height = model.get('_height') || '400px';
    grid.setAttribute('selection-mode', model.get('_selection_mode') || 'single');
    grid.setAttribute('edit-mode', model.get('_editable') ? 'dblclick' : 'none');
    grid.setAttribute('theme', model.get('_theme') || 'auto');
    grid.setAttribute('locale', model.get('_locale') || 'en-US');
  }

  // --- Event forwarding (JS → Python) ---
  grid.addEventListener('selection-change', (e) => {
    const detail = e.detail || {};
    model.set('selected_rows', detail.rows || []);
    model.save_changes();
  });

  grid.addEventListener('sort-change', (e) => {
    model.set('sort_state', e.detail?.columns || []);
    model.save_changes();
  });

  grid.addEventListener('filter-change', (e) => {
    model.set('filter_state', e.detail?.filters || []);
    model.save_changes();
  });

  grid.addEventListener('edit-commit', (e) => {
    const history = model.get('edit_history') || [];
    history.push(e.detail || {});
    model.set('edit_history', history);
    model.save_changes();
  });

  // --- Command handling (Python → JS) ---
  model.on('msg:custom', (msg) => {
    if (!msg || !msg.type) return;
    switch (msg.type) {
      case 'sort':
        if (grid.gridApi) grid.gridApi.sort(msg.column, msg.direction);
        break;
      case 'filter':
        if (grid.gridApi) grid.gridApi.addFilter(msg.column, msg.operator, msg.value);
        break;
      case 'clearFilters':
        if (grid.gridApi) grid.gridApi.clearFilters();
        break;
      case 'clearSort':
        if (grid.gridApi) grid.gridApi.clearSort();
        break;
      case 'selectRows':
        if (grid.gridApi) grid.gridApi.select(msg.indices || []);
        break;
      case 'deselectAll':
        if (grid.gridApi) grid.gridApi.deselectAll();
        break;
      case 'scrollToRow':
        if (grid.gridApi) grid.gridApi.scrollToRow(msg.index);
        break;
      case 'importState':
        if (grid.gridApi && msg.state) grid.gridApi.importState(msg.state);
        break;
    }
  });

  // --- Model change listeners ---
  model.on('change:_data_ipc', updateData);
  model.on('change:_columns_json', updateColumns);
  model.on('change:_height', syncProperties);
  model.on('change:_selection_mode', syncProperties);
  model.on('change:_editable', syncProperties);
  model.on('change:_theme', syncProperties);
  model.on('change:_locale', syncProperties);

  // Initial render
  updateData();
  updateColumns();

  // Cleanup
  return () => {
    model.off('change:_data_ipc', updateData);
    model.off('change:_columns_json', updateColumns);
    model.off('change:_height', syncProperties);
    if (grid.gridApi) grid.gridApi.destroy();
    container.remove();
  };
}
