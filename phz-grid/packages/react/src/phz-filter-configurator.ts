'use client';
/**
 * @phozart/react — PhzFilterConfigurator React Component
 *
 * Wraps the <phz-filter-configurator> Web Component for React using @lit/react.
 * Configure which filter definitions appear on a specific report/dashboard,
 * assign data columns, set per-binding overrides.
 */
import React, { createElement } from 'react';
import { createComponent, type EventName } from '@lit/react';
import { PhzFilterConfigurator as PhzFilterConfiguratorElement } from '@phozart/workspace/criteria-admin';

const PhzFilterConfiguratorLit = createComponent({
  tagName: 'phz-filter-configurator',
  elementClass: PhzFilterConfiguratorElement,
  react: React,
  events: {
    onBindingAddEvent: 'binding-add' as EventName<CustomEvent>,
    onBindingRemoveEvent: 'binding-remove' as EventName<CustomEvent>,
    onBindingUpdateEvent: 'binding-update' as EventName<CustomEvent>,
    onBindingReorderEvent: 'binding-reorder' as EventName<CustomEvent>,
    onOpenDesignerEvent: 'open-designer' as EventName<CustomEvent>,
  },
});

export interface PhzFilterConfiguratorProps {
  // Required
  definitions: any[];

  // Optional
  bindings?: any[];
  artefactId?: string;
  artefactName?: string;
  availableColumns?: string[];

  // Events
  onBindingAdd?: (detail: any) => void;
  onBindingRemove?: (detail: any) => void;
  onBindingUpdate?: (detail: any) => void;
  onBindingReorder?: (detail: any) => void;
  onOpenDesigner?: (detail: any) => void;

  className?: string;
  style?: React.CSSProperties;
}

function wrapDetail(handler?: (detail: any) => void) {
  return handler ? (e: CustomEvent) => handler(e.detail) : undefined;
}

export function PhzFilterConfigurator(props: PhzFilterConfiguratorProps) {
  const litProps: Record<string, unknown> = {
    definitions: props.definitions,
    bindings: props.bindings,
    artefactId: props.artefactId,
    artefactName: props.artefactName,
    availableColumns: props.availableColumns,
    onBindingAddEvent: wrapDetail(props.onBindingAdd),
    onBindingRemoveEvent: wrapDetail(props.onBindingRemove),
    onBindingUpdateEvent: wrapDetail(props.onBindingUpdate),
    onBindingReorderEvent: wrapDetail(props.onBindingReorder),
    onOpenDesignerEvent: wrapDetail(props.onOpenDesigner),
    class: props.className,
    style: props.style,
  };

  // Remove undefined entries so Lit defaults are not overwritten
  for (const key of Object.keys(litProps)) {
    if (litProps[key] === undefined) delete litProps[key];
  }

  return createElement(PhzFilterConfiguratorLit as any, litProps);
}
