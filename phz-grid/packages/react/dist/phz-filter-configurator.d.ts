/**
 * @phozart/phz-react — PhzFilterConfigurator React Component
 *
 * Wraps the <phz-filter-configurator> Web Component for React using @lit/react.
 * Configure which filter definitions appear on a specific report/dashboard,
 * assign data columns, set per-binding overrides.
 */
import React from 'react';
export interface PhzFilterConfiguratorProps {
    definitions: any[];
    bindings?: any[];
    artefactId?: string;
    artefactName?: string;
    availableColumns?: string[];
    onBindingAdd?: (detail: any) => void;
    onBindingRemove?: (detail: any) => void;
    onBindingUpdate?: (detail: any) => void;
    onBindingReorder?: (detail: any) => void;
    onOpenDesigner?: (detail: any) => void;
    className?: string;
    style?: React.CSSProperties;
}
export declare function PhzFilterConfigurator(props: PhzFilterConfiguratorProps): React.DetailedReactHTMLElement<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
//# sourceMappingURL=phz-filter-configurator.d.ts.map