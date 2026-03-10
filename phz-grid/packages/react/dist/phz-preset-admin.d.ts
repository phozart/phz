/**
 * @phozart/phz-react — PhzPresetAdmin React Component
 *
 * Wraps the <phz-preset-admin> Web Component for React using @lit/react.
 * Admin UI for managing selection presets (cross-filter or per-filter modes).
 */
import React from 'react';
export interface PhzPresetAdminProps {
    sharedPresets?: any[];
    userPresets?: any[];
    mode?: 'cross-filter' | 'per-filter';
    definitions?: any[];
    filterPresets?: any[];
    dataSources?: any[];
    data?: Record<string, unknown>[];
    onPresetCreate?: (detail: any) => void;
    onPresetUpdate?: (detail: any) => void;
    onPresetDelete?: (detail: any) => void;
    onFilterPresetCreate?: (detail: any) => void;
    onFilterPresetUpdate?: (detail: any) => void;
    onFilterPresetDelete?: (detail: any) => void;
    onFilterPresetCopy?: (detail: any) => void;
    onFilterPresetContextMenu?: (detail: any) => void;
    className?: string;
    style?: React.CSSProperties;
}
export declare function PhzPresetAdmin(props: PhzPresetAdminProps): React.DetailedReactHTMLElement<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
//# sourceMappingURL=phz-preset-admin.d.ts.map