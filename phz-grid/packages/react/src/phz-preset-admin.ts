'use client';
/**
 * @phozart/phz-react — PhzPresetAdmin React Component
 *
 * Wraps the <phz-preset-admin> Web Component for React using @lit/react.
 * Admin UI for managing selection presets (cross-filter or per-filter modes).
 */
import React, { createElement } from 'react';
import { createComponent, type EventName } from '@lit/react';
import { PhzPresetAdmin as PhzPresetAdminElement } from '@phozart/phz-workspace/criteria-admin';

const PhzPresetAdminLit = createComponent({
  tagName: 'phz-preset-admin',
  elementClass: PhzPresetAdminElement,
  react: React,
  events: {
    onPresetCreateEvent: 'preset-create' as EventName<CustomEvent>,
    onPresetUpdateEvent: 'preset-update' as EventName<CustomEvent>,
    onPresetDeleteEvent: 'preset-delete' as EventName<CustomEvent>,
    onFilterPresetCreateEvent: 'filter-preset-create' as EventName<CustomEvent>,
    onFilterPresetUpdateEvent: 'filter-preset-update' as EventName<CustomEvent>,
    onFilterPresetDeleteEvent: 'filter-preset-delete' as EventName<CustomEvent>,
    onFilterPresetCopyEvent: 'filter-preset-copy' as EventName<CustomEvent>,
    onFilterPresetContextMenuEvent: 'filter-preset-contextmenu' as EventName<CustomEvent>,
  },
});

export interface PhzPresetAdminProps {
  // Presets
  sharedPresets?: any[];
  userPresets?: any[];

  // Mode
  mode?: 'cross-filter' | 'per-filter';

  // Per-filter mode data
  definitions?: any[];
  filterPresets?: any[];
  dataSources?: any[];
  data?: Record<string, unknown>[];

  // Cross-filter events
  onPresetCreate?: (detail: any) => void;
  onPresetUpdate?: (detail: any) => void;
  onPresetDelete?: (detail: any) => void;

  // Per-filter events
  onFilterPresetCreate?: (detail: any) => void;
  onFilterPresetUpdate?: (detail: any) => void;
  onFilterPresetDelete?: (detail: any) => void;
  onFilterPresetCopy?: (detail: any) => void;
  onFilterPresetContextMenu?: (detail: any) => void;

  className?: string;
  style?: React.CSSProperties;
}

function wrapDetail(handler?: (detail: any) => void) {
  return handler ? (e: CustomEvent) => handler(e.detail) : undefined;
}

export function PhzPresetAdmin(props: PhzPresetAdminProps) {
  const litProps: Record<string, unknown> = {
    sharedPresets: props.sharedPresets,
    userPresets: props.userPresets,
    mode: props.mode,
    definitions: props.definitions,
    filterPresets: props.filterPresets,
    dataSources: props.dataSources,
    data: props.data,
    onPresetCreateEvent: wrapDetail(props.onPresetCreate),
    onPresetUpdateEvent: wrapDetail(props.onPresetUpdate),
    onPresetDeleteEvent: wrapDetail(props.onPresetDelete),
    onFilterPresetCreateEvent: wrapDetail(props.onFilterPresetCreate),
    onFilterPresetUpdateEvent: wrapDetail(props.onFilterPresetUpdate),
    onFilterPresetDeleteEvent: wrapDetail(props.onFilterPresetDelete),
    onFilterPresetCopyEvent: wrapDetail(props.onFilterPresetCopy),
    onFilterPresetContextMenuEvent: wrapDetail(props.onFilterPresetContextMenu),
    class: props.className,
    style: props.style,
  };

  // Remove undefined entries so Lit defaults are not overwritten
  for (const key of Object.keys(litProps)) {
    if (litProps[key] === undefined) delete litProps[key];
  }

  return createElement(PhzPresetAdminLit as any, litProps);
}
