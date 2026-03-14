/**
 * @phozart/workspace — CORS Handler (Q.2)
 *
 * Diagnoses fetch errors that are likely caused by CORS restrictions
 * and provides actionable resolution suggestions to the user.
 */
export type CORSResolution = 'download-manually' | 'configure-server' | 'use-local-proxy';
export interface CORSDiagnosis {
    isCORS: boolean;
    url: string;
    message: string;
    resolutions: CORSResolution[];
}
export declare function diagnoseCORSError(error: unknown, url: string): CORSDiagnosis;
//# sourceMappingURL=cors-handler.d.ts.map