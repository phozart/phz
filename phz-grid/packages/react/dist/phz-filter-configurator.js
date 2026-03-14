'use client';
/**
 * @phozart/react — PhzFilterConfigurator React Component
 *
 * Wraps the <phz-filter-configurator> Web Component for React using @lit/react.
 * Configure which filter definitions appear on a specific report/dashboard,
 * assign data columns, set per-binding overrides.
 */
import React, { createElement } from 'react';
import { createComponent } from '@lit/react';
import { PhzFilterConfigurator as PhzFilterConfiguratorElement } from '@phozart/workspace/criteria-admin';
const PhzFilterConfiguratorLit = createComponent({
    tagName: 'phz-filter-configurator',
    elementClass: PhzFilterConfiguratorElement,
    react: React,
    events: {
        onBindingAddEvent: 'binding-add',
        onBindingRemoveEvent: 'binding-remove',
        onBindingUpdateEvent: 'binding-update',
        onBindingReorderEvent: 'binding-reorder',
        onOpenDesignerEvent: 'open-designer',
    },
});
function wrapDetail(handler) {
    return handler ? (e) => handler(e.detail) : undefined;
}
export function PhzFilterConfigurator(props) {
    const litProps = {
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
        if (litProps[key] === undefined)
            delete litProps[key];
    }
    return createElement(PhzFilterConfiguratorLit, litProps);
}
//# sourceMappingURL=phz-filter-configurator.js.map