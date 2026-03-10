/**
 * @phozart/phz-workspace — CORS Handler (Q.2)
 *
 * Diagnoses fetch errors that are likely caused by CORS restrictions
 * and provides actionable resolution suggestions to the user.
 */
function isCORSError(error) {
    if (error == null)
        return false;
    // TypeError with "Failed to fetch" / "NetworkError" is the canonical CORS signal
    if (error instanceof TypeError) {
        const msg = error.message.toLowerCase();
        if (msg.includes('failed to fetch') || msg.includes('networkerror')) {
            return true;
        }
    }
    // Explicit CORS mentions in error message
    if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('cors') || msg.includes('access-control-allow-origin')) {
            return true;
        }
    }
    return false;
}
function isLocalURL(url) {
    try {
        const parsed = new URL(url);
        const host = parsed.hostname;
        return host === 'localhost' || host === '127.0.0.1' || host === '::1';
    }
    catch {
        return false;
    }
}
export function diagnoseCORSError(error, url) {
    if (!isCORSError(error)) {
        return {
            isCORS: false,
            url,
            message: error instanceof Error ? error.message : 'Unknown error',
            resolutions: [],
        };
    }
    const resolutions = ['download-manually', 'configure-server'];
    // Only suggest local proxy for remote URLs (not localhost)
    if (!isLocalURL(url)) {
        resolutions.push('use-local-proxy');
    }
    return {
        isCORS: true,
        url,
        message: `CORS policy blocked the request to ${url}. ` +
            'The remote server does not include the Access-Control-Allow-Origin header. ' +
            'You can download the file manually and upload it, configure the server to allow cross-origin requests, ' +
            'or route through a local proxy server.',
        resolutions,
    };
}
//# sourceMappingURL=cors-handler.js.map