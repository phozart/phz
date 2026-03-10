/**
 * @phozart/phz-workspace — Dashboard DnD Reorder Utils (L.13)
 *
 * Immutable array reorder operations for dashboard widget lists.
 */

interface Identifiable {
  id: string;
  weight?: number;
}

export function moveWidget<T extends Identifiable>(
  widgets: T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  if (fromIndex === toIndex) return [...widgets];
  const result = [...widgets];
  const [item] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, item);
  return result;
}

export function insertBefore<T extends Identifiable>(
  widgets: T[],
  widgetId: string,
  beforeId: string,
): T[] {
  const widgetIdx = widgets.findIndex(w => w.id === widgetId);
  const beforeIdx = widgets.findIndex(w => w.id === beforeId);
  if (widgetIdx === -1 || beforeIdx === -1) return [...widgets];

  const result = widgets.filter(w => w.id !== widgetId);
  const insertAt = result.findIndex(w => w.id === beforeId);
  result.splice(insertAt, 0, widgets[widgetIdx]);
  return result;
}

export function updateWeight<T extends Identifiable>(
  widgets: T[],
  widgetId: string,
  newWeight: number,
): T[] {
  const idx = widgets.findIndex(w => w.id === widgetId);
  if (idx === -1) return [...widgets];
  return widgets.map(w =>
    w.id === widgetId ? { ...w, weight: newWeight } : w,
  );
}
