import { describe, it, expect } from 'vitest';
import { DEFAULT_TEMPLATES, registerDefaultTemplates } from '../templates/default-templates.js';
import { isWidgetManifest, validateWidgetVariants } from '../types.js';
import { flattenLayoutWidgets } from '../schema/config-layers.js';

describe('Default Templates', () => {
  it('provides 9 templates', () => {
    expect(DEFAULT_TEMPLATES).toHaveLength(9);
  });

  it('every template has a unique id', () => {
    const ids = DEFAULT_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every template has a name and description', () => {
    for (const t of DEFAULT_TEMPLATES) {
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
    }
  });

  it('every template has at least one match rule', () => {
    for (const t of DEFAULT_TEMPLATES) {
      expect(t.matchRules.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every template has at least one widget slot', () => {
    for (const t of DEFAULT_TEMPLATES) {
      expect(t.widgetSlots.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every template layout references valid widget slot IDs', () => {
    for (const t of DEFAULT_TEMPLATES) {
      const layoutWidgets = flattenLayoutWidgets(t.layout);
      const slotIds = new Set(t.widgetSlots.map(s => s.slotId));
      for (const wid of layoutWidgets) {
        expect(slotIds.has(wid), `Template "${t.name}" layout references "${wid}" not in widgetSlots`).toBe(true);
      }
    }
  });

  it('every template is marked as builtIn', () => {
    for (const t of DEFAULT_TEMPLATES) {
      expect(t.builtIn).toBe(true);
    }
  });

  it('every template has tags', () => {
    for (const t of DEFAULT_TEMPLATES) {
      expect(t.tags.length).toBeGreaterThanOrEqual(1);
    }
  });

  describe('specific templates', () => {
    it('has KPI Overview template', () => {
      const t = DEFAULT_TEMPLATES.find(t => t.name.includes('KPI'));
      expect(t).toBeDefined();
      expect(t!.category).toBe('overview');
    });

    it('has Time Series template', () => {
      const t = DEFAULT_TEMPLATES.find(t => t.name.includes('Time Series'));
      expect(t).toBeDefined();
    });

    it('has Tabular Report template', () => {
      const t = DEFAULT_TEMPLATES.find(t => t.name.includes('Tabular'));
      expect(t).toBeDefined();
    });
  });
});
