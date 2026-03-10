/**
 * @phozart/phz-workspace — Filter Preset Manager (O.4)
 *
 * Save/load/share named filter presets. Headless logic —
 * Lit components can be layered on top.
 */

import type { FilterValue } from '../types.js';

// ========================================================================
// FilterPreset type
// ========================================================================

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterValue[];
  createdAt: number;
  updatedAt: number;
}

// ========================================================================
// FilterPresetManager interface
// ========================================================================

export interface FilterPresetManager {
  list(): FilterPreset[];
  load(id: string): FilterPreset | undefined;
  save(name: string, filters: FilterValue[]): FilterPreset;
  update(id: string, changes: { name?: string; filters?: FilterValue[] }): void;
  delete(id: string): void;
  subscribe(listener: () => void): () => void;
}

// ========================================================================
// Factory
// ========================================================================

let counter = 0;
function generateId(): string {
  return `preset_${Date.now()}_${++counter}`;
}

export function createFilterPresetManager(): FilterPresetManager {
  const presets = new Map<string, FilterPreset>();
  const listeners = new Set<() => void>();

  function notify(): void {
    for (const listener of listeners) {
      listener();
    }
  }

  return {
    list() {
      return Array.from(presets.values());
    },

    load(id: string) {
      return presets.get(id);
    },

    save(name: string, filters: FilterValue[]): FilterPreset {
      const now = Date.now();
      const preset: FilterPreset = {
        id: generateId(),
        name,
        filters: [...filters],
        createdAt: now,
        updatedAt: now,
      };
      presets.set(preset.id, preset);
      notify();
      return preset;
    },

    update(id: string, changes: { name?: string; filters?: FilterValue[] }) {
      const existing = presets.get(id);
      if (!existing) return;

      if (changes.name !== undefined) existing.name = changes.name;
      if (changes.filters !== undefined) existing.filters = [...changes.filters];
      existing.updatedAt = Date.now();
      notify();
    },

    delete(id: string) {
      if (presets.delete(id)) {
        notify();
      }
    },

    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}
