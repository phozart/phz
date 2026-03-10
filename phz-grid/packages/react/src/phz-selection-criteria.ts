'use client';
/**
 * @phozart/phz-react — PhzSelectionCriteria React Component
 *
 * Wraps the <phz-selection-criteria> Web Component for React using @lit/react.
 * Provides a filter bar + drawer UI with presets, tree selects, date ranges, etc.
 */
import React, {
  createElement,
  forwardRef,
  useRef,
  useImperativeHandle,
} from 'react';
import { createComponent, type EventName } from '@lit/react';
import type { CriteriaConfig, SelectionContext, SelectionPreset } from '@phozart/phz-core';
import { PhzSelectionCriteria as PhzSelectionCriteriaElement } from '@phozart/phz-criteria';

const PhzSelectionCriteriaLit = createComponent({
  tagName: 'phz-selection-criteria',
  elementClass: PhzSelectionCriteriaElement,
  react: React,
  events: {
    onCriteriaChangeEvent: 'criteria-change' as EventName<CustomEvent>,
    onCriteriaApplyEvent: 'criteria-apply' as EventName<CustomEvent>,
    onCriteriaResetEvent: 'criteria-reset' as EventName<CustomEvent>,
    onCriteriaPinChangeEvent: 'criteria-pin-change' as EventName<CustomEvent>,
  },
});

/** Imperative API exposed via ref on the PhzSelectionCriteria component. */
export interface CriteriaApi {
  /** Returns the current selection context (field values). */
  getContext(): SelectionContext;
  /** Sets the selection context (field values). */
  setContext(ctx: SelectionContext): void;
  /** Triggers apply (validates + dispatches criteria-apply). */
  apply(): void;
  /** Resets all fields to defaults. */
  reset(): void;
  /** Opens the filter drawer programmatically. */
  openDrawer(): void;
  /** Closes the filter drawer programmatically. */
  closeDrawer(): void;
}

export interface PhzSelectionCriteriaProps {
  // Config (required)
  config: CriteriaConfig;

  // Data & presets
  data?: Record<string, unknown>[];
  presets?: SelectionPreset[];
  initialState?: SelectionContext;
  dataSources?: Record<string, any>;

  // Registry mode
  registryMode?: boolean;
  filterRegistry?: any;
  filterBindings?: any;
  filterStateManager?: any;
  filterRuleEngine?: any;
  criteriaOutputManager?: any;
  artefactId?: string;
  resolvedFields?: any[];

  // Event callbacks
  onCriteriaChange?: (detail: any) => void;
  onCriteriaApply?: (detail: any) => void;
  onCriteriaReset?: (detail: any) => void;
  onPinChange?: (detail: { pinned: boolean; width: number }) => void;

  className?: string;
  style?: React.CSSProperties;
}

function wrapDetail(handler?: (detail: any) => void) {
  return handler ? (e: CustomEvent) => handler(e.detail) : undefined;
}

/**
 * React component wrapping the <phz-selection-criteria> Web Component.
 * Forward ref exposes the CriteriaApi for imperative operations.
 */
export const PhzSelectionCriteria = forwardRef<CriteriaApi, PhzSelectionCriteriaProps>(
  function PhzSelectionCriteria(props, ref) {
    const elementRef = useRef<InstanceType<typeof PhzSelectionCriteriaElement> | null>(null);

    // Expose CriteriaApi via ref — uses public methods added in WP-1.3
    useImperativeHandle(ref, () => ({
      getContext(): SelectionContext {
        const el = elementRef.current as any;
        return el?.getContext?.() ?? {};
      },
      setContext(ctx: SelectionContext): void {
        const el = elementRef.current as any;
        el?.setContext?.(ctx);
      },
      apply(): void {
        const el = elementRef.current as any;
        el?.apply?.();
      },
      reset(): void {
        const el = elementRef.current as any;
        el?.reset?.();
      },
      openDrawer(): void {
        const el = elementRef.current as any;
        el?.openDrawer?.();
      },
      closeDrawer(): void {
        const el = elementRef.current as any;
        el?.closeDrawer?.();
      },
    }));

    const litProps: Record<string, unknown> = {
      ref: elementRef,
      config: props.config,
      data: props.data,
      presets: props.presets,
      initialState: props.initialState,
      dataSources: props.dataSources,
      registryMode: props.registryMode,
      filterRegistry: props.filterRegistry,
      filterBindings: props.filterBindings,
      filterStateManager: props.filterStateManager,
      filterRuleEngine: props.filterRuleEngine,
      criteriaOutputManager: props.criteriaOutputManager,
      artefactId: props.artefactId,
      resolvedFields: props.resolvedFields,
      onCriteriaChangeEvent: wrapDetail(props.onCriteriaChange),
      onCriteriaApplyEvent: wrapDetail(props.onCriteriaApply),
      onCriteriaResetEvent: wrapDetail(props.onCriteriaReset),
      onCriteriaPinChangeEvent: wrapDetail(props.onPinChange),
      class: props.className,
      style: props.style,
    };

    // Remove undefined entries so Lit defaults are not overwritten
    for (const key of Object.keys(litProps)) {
      if (litProps[key] === undefined) delete litProps[key];
    }

    return createElement(PhzSelectionCriteriaLit as any, litProps);
  },
);
