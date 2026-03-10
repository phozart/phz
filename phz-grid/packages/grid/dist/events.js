export function dispatchGridEvent(host, eventName, detail) {
    host.dispatchEvent(new CustomEvent(eventName, {
        detail,
        bubbles: true,
        composed: true,
    }));
}
//# sourceMappingURL=events.js.map