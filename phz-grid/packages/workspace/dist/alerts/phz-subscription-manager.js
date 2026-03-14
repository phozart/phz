/**
 * @phozart/workspace — Subscription Manager (N.2)
 *
 * Pure logic functions for creating and managing alert subscriptions.
 */
let subCounter = 0;
export function createSubscription(ruleId, channelId, recipientRef, format = 'inline') {
    return {
        id: `sub_${Date.now()}_${++subCounter}`,
        ruleId,
        channelId,
        recipientRef,
        format,
        active: true,
    };
}
export function validateSubscription(sub) {
    const errors = [];
    if (!sub.channelId || sub.channelId.trim() === '') {
        errors.push('Channel is required');
    }
    if (!sub.recipientRef || sub.recipientRef.trim() === '') {
        errors.push('Recipient is required');
    }
    return errors;
}
export function toggleSubscription(sub) {
    return { ...sub, active: !sub.active };
}
//# sourceMappingURL=phz-subscription-manager.js.map