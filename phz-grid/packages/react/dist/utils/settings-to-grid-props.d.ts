import type { ReportPresentation } from '@phozart/engine';
import type { PhzGridProps } from '../phz-grid.js';
/**
 * Converts a ReportPresentation bundle into a partial set of PhzGridProps.
 * This is the bridge that lets admin settings flow back to the grid.
 *
 * Usage:
 *   <PhzGrid {...settingsToGridProps(settings)} data={data} columns={columns} />
 */
export declare function settingsToGridProps(settings: ReportPresentation | null | undefined): Partial<PhzGridProps>;
//# sourceMappingURL=settings-to-grid-props.d.ts.map