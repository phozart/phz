'use client';
/**
 * @phozart/react — PhzSelectionCriteria React Component
 *
 * Wraps the <phz-selection-criteria> Web Component for React using @lit/react.
 * Provides a filter bar + drawer UI with presets, tree selects, date ranges, etc.
 */
import React, { createElement, forwardRef, useRef, useImperativeHandle, } from 'react';
import { createComponent } from '@lit/react';
import { PhzSelectionCriteria as PhzSelectionCriteriaElement } from '@phozart/criteria';
const PhzSelectionCriteriaLit = createComponent({
    tagName: 'phz-selection-criteria',
    elementClass: PhzSelectionCriteriaElement,
    react: React,
    events: {
        onCriteriaChangeEvent: 'criteria-change',
        onCriteriaApplyEvent: 'criteria-apply',
        onCriteriaResetEvent: 'criteria-reset',
        onCriteriaPinChangeEvent: 'criteria-pin-change',
    },
});
function wrapDetail(handler) {
    return handler ? (e) => handler(e.detail) : undefined;
}
/**
 * React component wrapping the <phz-selection-criteria> Web Component.
 * Forward ref exposes the CriteriaApi for imperative operations.
 */
export const PhzSelectionCriteria = forwardRef(function PhzSelectionCriteria(props, ref) {
    const elementRef = useRef(null);
    // Expose CriteriaApi via ref — uses public methods added in WP-1.3
    useImperativeHandle(ref, () => ({
        getContext() {
            const el = elementRef.current;
            return el?.getContext?.() ?? {};
        },
        setContext(ctx) {
            const el = elementRef.current;
            el?.setContext?.(ctx);
        },
        apply() {
            const el = elementRef.current;
            el?.apply?.();
        },
        reset() {
            const el = elementRef.current;
            el?.reset?.();
        },
        openDrawer() {
            const el = elementRef.current;
            el?.openDrawer?.();
        },
        closeDrawer() {
            const el = elementRef.current;
            el?.closeDrawer?.();
        },
    }));
    const litProps = {
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
        if (litProps[key] === undefined)
            delete litProps[key];
    }
    return createElement(PhzSelectionCriteriaLit, litProps);
});
//# sourceMappingURL=phz-selection-criteria.js.map