'use client';
/**
 * @phozart/phz-react — PhzPresetAdmin React Component
 *
 * Wraps the <phz-preset-admin> Web Component for React using @lit/react.
 * Admin UI for managing selection presets (cross-filter or per-filter modes).
 */
import React, { createElement } from 'react';
import { createComponent } from '@lit/react';
import { PhzPresetAdmin as PhzPresetAdminElement } from '@phozart/phz-workspace/criteria-admin';
const PhzPresetAdminLit = createComponent({
    tagName: 'phz-preset-admin',
    elementClass: PhzPresetAdminElement,
    react: React,
    events: {
        onPresetCreateEvent: 'preset-create',
        onPresetUpdateEvent: 'preset-update',
        onPresetDeleteEvent: 'preset-delete',
        onFilterPresetCreateEvent: 'filter-preset-create',
        onFilterPresetUpdateEvent: 'filter-preset-update',
        onFilterPresetDeleteEvent: 'filter-preset-delete',
        onFilterPresetCopyEvent: 'filter-preset-copy',
        onFilterPresetContextMenuEvent: 'filter-preset-contextmenu',
    },
});
function wrapDetail(handler) {
    return handler ? (e) => handler(e.detail) : undefined;
}
export function PhzPresetAdmin(props) {
    const litProps = {
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
        if (litProps[key] === undefined)
            delete litProps[key];
    }
    return createElement(PhzPresetAdminLit, litProps);
}
//# sourceMappingURL=phz-preset-admin.js.map