/**
 * Safe @customElement decorator that guards against duplicate registration.
 *
 * In code-splitting environments (e.g. webpack/Next.js), the same module may
 * be evaluated in multiple chunks. The native CustomElementRegistry throws if
 * `define()` is called twice with the same tag name. This decorator silently
 * skips registration when the element is already defined.
 */
export function safeCustomElement(tagName) {
    return (target) => {
        if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
            customElements.define(tagName, target);
        }
    };
}
//# sourceMappingURL=safe-custom-element.js.map