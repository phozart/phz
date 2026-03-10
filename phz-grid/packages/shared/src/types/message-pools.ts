/**
 * @phozart/phz-shared — Message Pools (C-2.13)
 *
 * Pre-written message pools for error and empty state scenarios.
 * Each scenario has messages in three tones: friendly, technical, minimal.
 *
 * 13 error scenarios x 3 tones x ~5 messages each
 * 9 empty state scenarios x 3 tones x ~5 messages each
 */

// ========================================================================
// Types
// ========================================================================

export type MessageTone = 'friendly' | 'technical' | 'minimal';

export interface MessagePool {
  scenario: string;
  tone: MessageTone;
  messages: string[];
}

// ========================================================================
// Error Message Pools (13 scenarios x 3 tones)
// ========================================================================

export const ERROR_MESSAGE_POOLS: MessagePool[] = [
  // --- network-error ---
  {
    scenario: 'network-error',
    tone: 'friendly',
    messages: [
      'Looks like the internet took a coffee break. Try again in a moment.',
      'We lost the connection. Check your network and give it another shot.',
      'The network gremlins struck again. Hang tight and retry.',
      'Oops, the server seems unreachable right now. Please try again.',
      'Your connection hiccuped. A quick retry should do the trick.',
    ],
  },
  {
    scenario: 'network-error',
    tone: 'technical',
    messages: [
      'Network request failed: unable to establish connection to the server.',
      'HTTP request timed out or was aborted due to network unavailability.',
      'Connection refused: the remote host did not respond within the timeout period.',
      'DNS resolution failed or the network interface is unavailable.',
      'Transport-level error: TCP connection could not be established.',
    ],
  },
  {
    scenario: 'network-error',
    tone: 'minimal',
    messages: [
      'Connection lost.',
      'Network unavailable.',
      'Cannot reach server.',
      'Request failed.',
      'No connection.',
    ],
  },

  // --- auth-expired ---
  {
    scenario: 'auth-expired',
    tone: 'friendly',
    messages: [
      'Your session wandered off. Time to sign in again.',
      'For your security, your session expired. Please log back in.',
      'It has been a while! Sign in again to pick up where you left off.',
      'Your session timed out. A quick sign-in will get you back.',
      'Looks like your session ended. Please authenticate again.',
    ],
  },
  {
    scenario: 'auth-expired',
    tone: 'technical',
    messages: [
      'Authentication token expired. Re-authentication required.',
      'Session JWT has exceeded its TTL. Please re-authenticate.',
      'Bearer token is no longer valid. Refresh token flow initiated.',
      'Server returned 401 Unauthorized: session credentials expired.',
      'Identity provider session terminated. New authentication required.',
    ],
  },
  {
    scenario: 'auth-expired',
    tone: 'minimal',
    messages: [
      'Session expired.',
      'Please sign in.',
      'Authentication required.',
      'Signed out.',
      'Login needed.',
    ],
  },

  // --- forbidden ---
  {
    scenario: 'forbidden',
    tone: 'friendly',
    messages: [
      'This area is off-limits. Talk to your admin for a hall pass.',
      'You do not have permission for this. Contact your administrator.',
      'Access denied. Your current role cannot view this resource.',
      'Sorry, this is a restricted area. Check with your admin.',
      'Your account does not have access here. An admin can help.',
    ],
  },
  {
    scenario: 'forbidden',
    tone: 'technical',
    messages: [
      'HTTP 403 Forbidden: insufficient permissions for the requested resource.',
      'Authorization check failed: user role lacks required permission.',
      'RBAC policy denied access. Required permission not in user scope.',
      'Access control list (ACL) rejected the request for this resource.',
      'Server returned 403: the authenticated user is not authorized.',
    ],
  },
  {
    scenario: 'forbidden',
    tone: 'minimal',
    messages: [
      'Access denied.',
      'Not authorized.',
      'Permission denied.',
      'Forbidden.',
      'No access.',
    ],
  },

  // --- not-found ---
  {
    scenario: 'not-found',
    tone: 'friendly',
    messages: [
      'We looked everywhere, but this one is gone.',
      'This page has left the building. It may have been moved or deleted.',
      'The item you are looking for does not exist. Double-check the link.',
      'Nothing here! The resource may have been removed.',
      'Could not find what you were looking for. Try the search bar.',
    ],
  },
  {
    scenario: 'not-found',
    tone: 'technical',
    messages: [
      'HTTP 404 Not Found: the requested resource does not exist at this URI.',
      'Resource lookup returned null: no record matches the provided identifier.',
      'Entity not found in the data store. It may have been deleted or never created.',
      'Route matched but the underlying resource was not located.',
      'Database query returned no rows for the given primary key.',
    ],
  },
  {
    scenario: 'not-found',
    tone: 'minimal',
    messages: [
      'Not found.',
      'Resource missing.',
      'Does not exist.',
      'Item not found.',
      'No match.',
    ],
  },

  // --- server-error ---
  {
    scenario: 'server-error',
    tone: 'friendly',
    messages: [
      'The server had a bad day. We are looking into it.',
      'Something went wrong on our end. Try again shortly.',
      'Oops, the backend stumbled. Retrying might help.',
      'Our systems hit a snag. The team has been notified.',
      'A server hiccup occurred. Please try again in a moment.',
    ],
  },
  {
    scenario: 'server-error',
    tone: 'technical',
    messages: [
      'HTTP 500 Internal Server Error: unhandled exception on the server.',
      'Server returned 5xx status code. Check server logs for details.',
      'Backend service threw an unrecoverable exception during request processing.',
      'Application server returned an error response with no specific error code.',
      'Upstream service failure: the API gateway received an invalid response.',
    ],
  },
  {
    scenario: 'server-error',
    tone: 'minimal',
    messages: [
      'Server error.',
      'Something went wrong.',
      'Internal error.',
      'Service unavailable.',
      'Try again later.',
    ],
  },

  // --- query-error ---
  {
    scenario: 'query-error',
    tone: 'friendly',
    messages: [
      'That query did not compute. Double-check the syntax.',
      'The data request failed. Check your filters and try again.',
      'Something is off with the query. Review your selections.',
      'The data engine could not process your request. Adjust your criteria.',
      'Query failed. Try simplifying your filters or expressions.',
    ],
  },
  {
    scenario: 'query-error',
    tone: 'technical',
    messages: [
      'SQL execution error: syntax error or invalid column reference.',
      'Query planner rejected the query due to an invalid expression.',
      'Data source returned an error during query execution.',
      'Aggregation pipeline failed: incompatible data types in expression.',
      'Filter expression evaluation failed: undefined field reference.',
    ],
  },
  {
    scenario: 'query-error',
    tone: 'minimal',
    messages: [
      'Query failed.',
      'Invalid query.',
      'Data error.',
      'Execution failed.',
      'Bad request.',
    ],
  },

  // --- parse-error ---
  {
    scenario: 'parse-error',
    tone: 'friendly',
    messages: [
      'The data came back in an unexpected format. Try refreshing.',
      'We could not understand the server response. It might be temporary.',
      'Data format mismatch. The response was not what we expected.',
      'Something garbled the response. A retry usually fixes this.',
      'The data payload could not be read. Please try again.',
    ],
  },
  {
    scenario: 'parse-error',
    tone: 'technical',
    messages: [
      'JSON parse error: unexpected token in response body.',
      'Arrow IPC buffer is malformed or has an incompatible schema version.',
      'Content-Type mismatch: expected application/json but received text/html.',
      'Deserialization failed: response structure does not match expected schema.',
      'Binary payload decoding error: invalid byte sequence at offset.',
    ],
  },
  {
    scenario: 'parse-error',
    tone: 'minimal',
    messages: [
      'Parse error.',
      'Bad response.',
      'Invalid data.',
      'Format error.',
      'Cannot read data.',
    ],
  },

  // --- quota-exceeded ---
  {
    scenario: 'quota-exceeded',
    tone: 'friendly',
    messages: [
      'You have hit the ceiling. Time to tidy up or upgrade.',
      'Usage limit reached. Consider cleaning up or upgrading your plan.',
      'You have used up your allowance. Free up space or contact support.',
      'Limit reached! Review your usage or upgrade for more capacity.',
      'Your quota is full. Remove some items or request a higher limit.',
    ],
  },
  {
    scenario: 'quota-exceeded',
    tone: 'technical',
    messages: [
      'HTTP 429 Too Many Requests: rate limit exceeded for this endpoint.',
      'Storage quota exceeded: allocated disk space has been consumed.',
      'API rate limit triggered: requests per minute cap reached.',
      'Row count limit exceeded: result set exceeds maximum allowed rows.',
      'Concurrent connection limit reached for the current tier.',
    ],
  },
  {
    scenario: 'quota-exceeded',
    tone: 'minimal',
    messages: [
      'Limit reached.',
      'Quota exceeded.',
      'Too many requests.',
      'Over limit.',
      'Rate limited.',
    ],
  },

  // --- timeout ---
  {
    scenario: 'timeout',
    tone: 'friendly',
    messages: [
      'That took forever (literally). Try a smaller dataset.',
      'The operation ran out of time. Narrow your filters and retry.',
      'Too much data, too little time. Try reducing the scope.',
      'The request timed out. Simplify your query for faster results.',
      'Patience has its limits, and so does our timeout. Try again with less data.',
    ],
  },
  {
    scenario: 'timeout',
    tone: 'technical',
    messages: [
      'Request exceeded the configured timeout threshold.',
      'Query execution timeout: operation exceeded maximum allowed duration.',
      'AbortSignal triggered: request cancelled after timeout period.',
      'Server-side query execution exceeded the statement_timeout limit.',
      'Gateway timeout (504): upstream service did not respond in time.',
    ],
  },
  {
    scenario: 'timeout',
    tone: 'minimal',
    messages: [
      'Timed out.',
      'Request too slow.',
      'Operation timeout.',
      'Too long.',
      'Try again.',
    ],
  },

  // --- unknown ---
  {
    scenario: 'unknown',
    tone: 'friendly',
    messages: [
      'Well, that was unexpected. Try again or contact support.',
      'An error of mysterious origin has appeared. Give it another try.',
      'Something went sideways. If this keeps happening, let us know.',
      'An unexpected error popped up. Refreshing might help.',
      'We are not sure what happened, but something did not work.',
    ],
  },
  {
    scenario: 'unknown',
    tone: 'technical',
    messages: [
      'Unclassified error: no specific error category could be determined.',
      'Unexpected exception caught at the application boundary.',
      'Error does not match any known error classification pattern.',
      'Runtime exception with no associated error code or category.',
      'Uncategorized failure: see browser console for stack trace.',
    ],
  },
  {
    scenario: 'unknown',
    tone: 'minimal',
    messages: [
      'Error occurred.',
      'Something failed.',
      'Unexpected error.',
      'Unknown error.',
      'Please retry.',
    ],
  },

  // --- config-error ---
  {
    scenario: 'config-error',
    tone: 'friendly',
    messages: [
      'The configuration seems off. Check your settings and try again.',
      'Something in the setup is not quite right. Review the configuration.',
      'A configuration issue is preventing this from working. Check your settings.',
      'The settings need some attention before this can work properly.',
      'Looks like a setup issue. Double-check your configuration.',
    ],
  },
  {
    scenario: 'config-error',
    tone: 'technical',
    messages: [
      'Configuration validation failed: required fields are missing or invalid.',
      'Schema validation error in the configuration object.',
      'Configuration merge conflict: incompatible settings detected.',
      'Widget configuration is malformed or references undefined data sources.',
      'Dashboard config version mismatch: migration required.',
    ],
  },
  {
    scenario: 'config-error',
    tone: 'minimal',
    messages: [
      'Bad configuration.',
      'Config error.',
      'Invalid settings.',
      'Setup required.',
      'Fix settings.',
    ],
  },

  // --- data-source-error ---
  {
    scenario: 'data-source-error',
    tone: 'friendly',
    messages: [
      'The data source is not responding. Check the connection settings.',
      'We cannot reach the data source. It might be down or misconfigured.',
      'Data source connection failed. Verify your credentials and try again.',
      'The data source ran into trouble. Check if it is online.',
      'Cannot pull data. The source may need to be reconnected.',
    ],
  },
  {
    scenario: 'data-source-error',
    tone: 'technical',
    messages: [
      'Data source connection refused: host unreachable or credentials invalid.',
      'JDBC/ODBC driver error: failed to establish connection to the database.',
      'Data source schema introspection failed: insufficient privileges.',
      'Connection pool exhausted for the target data source.',
      'Data source returned an incompatible protocol version.',
    ],
  },
  {
    scenario: 'data-source-error',
    tone: 'minimal',
    messages: [
      'Source unavailable.',
      'Connection failed.',
      'Data source error.',
      'Cannot connect.',
      'Source offline.',
    ],
  },

  // --- validation-error ---
  {
    scenario: 'validation-error',
    tone: 'friendly',
    messages: [
      'Some fields need your attention. Check the highlighted items.',
      'A few things need fixing before you can save. Review the form.',
      'Validation caught some issues. Correct them and try again.',
      'Please fix the highlighted errors before proceeding.',
      'Almost there! A few fields need correction.',
    ],
  },
  {
    scenario: 'validation-error',
    tone: 'technical',
    messages: [
      'Schema validation failed: one or more required fields are empty or invalid.',
      'Input validation error: field values do not conform to expected types.',
      'Form submission rejected: constraint violations detected.',
      'Zod validation failed: see individual field errors for details.',
      'Request payload does not satisfy the API contract schema.',
    ],
  },
  {
    scenario: 'validation-error',
    tone: 'minimal',
    messages: [
      'Validation failed.',
      'Fix errors.',
      'Invalid input.',
      'Check fields.',
      'Correct errors.',
    ],
  },
];

// ========================================================================
// Empty State Message Pools (9 scenarios x 3 tones)
// ========================================================================

export const EMPTY_STATE_MESSAGE_POOLS: MessagePool[] = [
  // --- no-data ---
  {
    scenario: 'no-data',
    tone: 'friendly',
    messages: [
      'No data here yet. Import a file or connect a data source to get started.',
      'This is a blank canvas waiting for your data. Add a source to begin.',
      'Nothing to show just yet. Connect some data and watch the magic happen.',
      'Your data source is connected but empty. Add some records to see results.',
      'All quiet on the data front. Upload a file to get things going.',
    ],
  },
  {
    scenario: 'no-data',
    tone: 'technical',
    messages: [
      'Data source returned 0 rows. Verify the source contains records.',
      'Query executed successfully but the result set is empty.',
      'Connected data source has no tables or the selected table has no rows.',
      'Schema detected but no data rows are present in the source.',
      'Data adapter returned an empty DataResult with 0 total rows.',
    ],
  },
  {
    scenario: 'no-data',
    tone: 'minimal',
    messages: [
      'No data.',
      'Empty dataset.',
      'No records.',
      'No rows.',
      'Source empty.',
    ],
  },

  // --- no-results ---
  {
    scenario: 'no-results',
    tone: 'friendly',
    messages: [
      'No matches found. Try broadening your search or adjusting filters.',
      'Your search came up empty. Try different keywords or fewer filters.',
      'Nothing matched your criteria. Loosen the filters and try again.',
      'Zero results. Remove some filters to see more data.',
      'The search returned nothing. Check for typos or try a broader query.',
    ],
  },
  {
    scenario: 'no-results',
    tone: 'technical',
    messages: [
      'Query returned 0 rows after applying the current filter set.',
      'All records were excluded by the active filter combination.',
      'Search index returned no matches for the given query string.',
      'Filter intersection yielded an empty result set.',
      'No rows satisfy the WHERE clause produced by current criteria.',
    ],
  },
  {
    scenario: 'no-results',
    tone: 'minimal',
    messages: [
      'No results.',
      'Nothing found.',
      'No matches.',
      'Empty.',
      'Try different filters.',
    ],
  },

  // --- no-access ---
  {
    scenario: 'no-access',
    tone: 'friendly',
    messages: [
      'You do not have access to any items here. Ask your admin for permissions.',
      'This section is locked for your role. Contact your administrator.',
      'No accessible content. Your role may need additional permissions.',
      'All items in this area are restricted. Reach out to an admin.',
      'Nothing available for your account. An admin can grant access.',
    ],
  },
  {
    scenario: 'no-access',
    tone: 'technical',
    messages: [
      'RBAC policy filtered all items: no artifacts are visible to the current role.',
      'ViewerContext role does not match any share targets on available artifacts.',
      'Access control returned 0 visible artifacts for the authenticated user.',
      'Row-level security excluded all rows for the current user context.',
      'SecurityBinding restricted all items from the current viewer scope.',
    ],
  },
  {
    scenario: 'no-access',
    tone: 'minimal',
    messages: [
      'No access.',
      'Restricted.',
      'Not available.',
      'Contact admin.',
      'Locked.',
    ],
  },

  // --- not-configured ---
  {
    scenario: 'not-configured',
    tone: 'friendly',
    messages: [
      'This needs some setup first. Click configure to get started.',
      'Not set up yet. A few clicks and you will be ready to go.',
      'This component is waiting for its first configuration.',
      'Time to set things up! Configure this widget to see data.',
      'One more step: configure this component to start using it.',
    ],
  },
  {
    scenario: 'not-configured',
    tone: 'technical',
    messages: [
      'Widget configuration is empty: dataBinding and appearance properties are unset.',
      'Required configuration fields are missing from the component props.',
      'Component rendered without a valid config object. Initial setup required.',
      'Data source reference is null. Configure a data binding to proceed.',
      'No valid WidgetConfig detected. The component requires initial setup.',
    ],
  },
  {
    scenario: 'not-configured',
    tone: 'minimal',
    messages: [
      'Not configured.',
      'Setup needed.',
      'Configure first.',
      'Unconfigured.',
      'Set up required.',
    ],
  },

  // --- loading-failed ---
  {
    scenario: 'loading-failed',
    tone: 'friendly',
    messages: [
      'Loading did not work out. Hit retry and give it another chance.',
      'Something went wrong during loading. A retry might fix it.',
      'Failed to load. Check your connection and try again.',
      'The data did not load properly. Refresh to try once more.',
      'Loading hit a bump. Give it another go with the retry button.',
    ],
  },
  {
    scenario: 'loading-failed',
    tone: 'technical',
    messages: [
      'Data loading failed: the fetch promise was rejected.',
      'DataAdapter.execute() threw an error during initial data load.',
      'Loading pipeline encountered an unrecoverable error at phase preload.',
      'Fetch completed but the response could not be processed.',
      'Initial data hydration failed. See error logs for details.',
    ],
  },
  {
    scenario: 'loading-failed',
    tone: 'minimal',
    messages: [
      'Load failed.',
      'Error loading.',
      'Try again.',
      'Refresh needed.',
      'Cannot load.',
    ],
  },

  // --- first-time ---
  {
    scenario: 'first-time',
    tone: 'friendly',
    messages: [
      'Welcome aboard! Create your first item to get started.',
      'You are all set up. Let us build something together.',
      'Fresh start! Click the button below to create your first artifact.',
      'Hello there! This is where your data stories begin.',
      'Welcome to your workspace. Start by creating a dashboard or report.',
    ],
  },
  {
    scenario: 'first-time',
    tone: 'technical',
    messages: [
      'No artifacts exist in the current workspace. Create one to begin.',
      'Artifact store is empty. Use the create action to add the first item.',
      'Workspace initialized with no pre-existing configurations.',
      'User profile has no saved artifacts. Initial creation workflow available.',
      'Empty workspace detected. Navigate to the create dialog to begin.',
    ],
  },
  {
    scenario: 'first-time',
    tone: 'minimal',
    messages: [
      'Get started.',
      'Create first item.',
      'Welcome.',
      'Begin here.',
      'Start now.',
    ],
  },

  // --- no-selection ---
  {
    scenario: 'no-selection',
    tone: 'friendly',
    messages: [
      'Select an item from the list to see its details here.',
      'Nothing selected yet. Click an item to view more.',
      'Pick something from the list and its details will appear here.',
      'Waiting for your selection. Choose an item to inspect.',
      'The detail panel is ready. Just select an item.',
    ],
  },
  {
    scenario: 'no-selection',
    tone: 'technical',
    messages: [
      'No item selected. The detail view requires an active selection.',
      'Selection state is null. Click a row or card to populate the detail pane.',
      'Detail panel has no bound entity. Select an artifact to display properties.',
      'activeItemId is unset. User interaction required to populate this view.',
      'No selection event received. Awaiting user click or keyboard navigation.',
    ],
  },
  {
    scenario: 'no-selection',
    tone: 'minimal',
    messages: [
      'Nothing selected.',
      'Select an item.',
      'Choose one.',
      'No selection.',
      'Click to select.',
    ],
  },

  // --- empty-dashboard ---
  {
    scenario: 'empty-dashboard',
    tone: 'friendly',
    messages: [
      'This dashboard is a blank canvas. Drag widgets or pick a template.',
      'No widgets here yet. Start building by adding your first widget.',
      'Your dashboard is waiting for content. Browse templates to get inspired.',
      'Time to fill this up! Drag widgets from the palette.',
      'An empty dashboard is full of potential. Add widgets to bring it to life.',
    ],
  },
  {
    scenario: 'empty-dashboard',
    tone: 'technical',
    messages: [
      'Dashboard configuration has 0 widget placements. Add widgets to populate.',
      'WidgetPlacement array is empty. Use the widget palette to add components.',
      'Layout engine has no nodes to render. Dashboard requires widget configuration.',
      'DashboardConfig.widgets is an empty array. No layout to compute.',
      'No WidgetSlot entries found in the current LayoutNode tree.',
    ],
  },
  {
    scenario: 'empty-dashboard',
    tone: 'minimal',
    messages: [
      'Empty dashboard.',
      'Add widgets.',
      'No content.',
      'Start building.',
      'Add something.',
    ],
  },

  // --- no-favorites ---
  {
    scenario: 'no-favorites',
    tone: 'friendly',
    messages: [
      'No favorites yet. Star items you use often for quick access.',
      'Your favorites list is empty. Bookmark your most-used items.',
      'Nothing pinned yet. Add favorites to see them right here.',
      'Star your go-to dashboards and reports for easy access.',
      'Your shortcut list is clean. Start pinning items you love.',
    ],
  },
  {
    scenario: 'no-favorites',
    tone: 'technical',
    messages: [
      'User favorites collection is empty. No starred artifact IDs found.',
      'PersonalView favorites array has 0 entries for the current user.',
      'No bookmarked artifacts exist in the user preferences store.',
      'Favorites index has no records for the authenticated userId.',
      'Starred items query returned an empty result set.',
    ],
  },
  {
    scenario: 'no-favorites',
    tone: 'minimal',
    messages: [
      'No favorites.',
      'Nothing starred.',
      'Empty.',
      'Add favorites.',
      'Star items.',
    ],
  },
];

// ========================================================================
// Utility functions
// ========================================================================

/**
 * Get a random message for a given scenario and tone from a message pool.
 *
 * @param scenario - The error or empty state scenario name.
 * @param tone - The message tone (friendly, technical, minimal).
 * @param pools - The message pool array to search.
 * @returns A random message string, or a fallback if the scenario/tone is not found.
 */
export function getRandomMessage(
  scenario: string,
  tone: MessageTone,
  pools: MessagePool[],
): string {
  const pool = pools.find(p => p.scenario === scenario && p.tone === tone);
  if (!pool || pool.messages.length === 0) {
    return `${scenario}: no message available`;
  }
  const index = Math.floor(Math.random() * pool.messages.length);
  return pool.messages[index];
}

/**
 * Get all messages for a given scenario, grouped by tone.
 *
 * @param scenario - The error or empty state scenario name.
 * @param pools - The message pool array to search.
 * @returns An object mapping each MessageTone to its messages array.
 */
export function getAllMessages(
  scenario: string,
  pools: MessagePool[],
): Record<MessageTone, string[]> {
  const result: Record<MessageTone, string[]> = {
    friendly: [],
    technical: [],
    minimal: [],
  };

  for (const pool of pools) {
    if (pool.scenario === scenario) {
      result[pool.tone] = [...pool.messages];
    }
  }

  return result;
}

/**
 * Get all unique scenario names from a pool.
 */
export function getScenarios(pools: MessagePool[]): string[] {
  const set = new Set(pools.map(p => p.scenario));
  return Array.from(set).sort();
}

/**
 * Count total messages across all pools.
 */
export function countMessages(pools: MessagePool[]): number {
  return pools.reduce((sum, pool) => sum + pool.messages.length, 0);
}
