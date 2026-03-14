/**
 * @phozart/shared — Message Pools (C-2.13)
 *
 * Pre-written message pools for error and empty state scenarios.
 * Each scenario has messages in three tones: friendly, technical, minimal.
 *
 * 13 error scenarios x 3 tones x ~5 messages each
 * 9 empty state scenarios x 3 tones x ~5 messages each
 */
export type MessageTone = 'friendly' | 'technical' | 'minimal';
export interface MessagePool {
    scenario: string;
    tone: MessageTone;
    messages: string[];
}
export declare const ERROR_MESSAGE_POOLS: MessagePool[];
export declare const EMPTY_STATE_MESSAGE_POOLS: MessagePool[];
/**
 * Get a random message for a given scenario and tone from a message pool.
 *
 * @param scenario - The error or empty state scenario name.
 * @param tone - The message tone (friendly, technical, minimal).
 * @param pools - The message pool array to search.
 * @returns A random message string, or a fallback if the scenario/tone is not found.
 */
export declare function getRandomMessage(scenario: string, tone: MessageTone, pools: MessagePool[]): string;
/**
 * Get all messages for a given scenario, grouped by tone.
 *
 * @param scenario - The error or empty state scenario name.
 * @param pools - The message pool array to search.
 * @returns An object mapping each MessageTone to its messages array.
 */
export declare function getAllMessages(scenario: string, pools: MessagePool[]): Record<MessageTone, string[]>;
/**
 * Get all unique scenario names from a pool.
 */
export declare function getScenarios(pools: MessagePool[]): string[];
/**
 * Count total messages across all pools.
 */
export declare function countMessages(pools: MessagePool[]): number;
//# sourceMappingURL=message-pools.d.ts.map