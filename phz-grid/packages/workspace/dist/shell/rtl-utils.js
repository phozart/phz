/**
 * @phozart/workspace — RTL Utilities (L.18)
 *
 * Pure functions for RTL layout support.
 * Maps physical CSS properties to logical properties and
 * generates RTL override CSS blocks.
 */
export function resolveDirection(i18n) {
    return i18n?.direction ?? 'ltr';
}
const LTR_MAP = {
    'margin-left': 'margin-inline-start',
    'margin-right': 'margin-inline-end',
    'padding-left': 'padding-inline-start',
    'padding-right': 'padding-inline-end',
    'border-left': 'border-inline-start',
    'border-right': 'border-inline-end',
    'left': 'inset-inline-start',
    'right': 'inset-inline-end',
};
const RTL_MAP = {
    'margin-left': 'margin-inline-end',
    'margin-right': 'margin-inline-start',
    'padding-left': 'padding-inline-end',
    'padding-right': 'padding-inline-start',
    'border-left': 'border-inline-end',
    'border-right': 'border-inline-start',
    'left': 'inset-inline-end',
    'right': 'inset-inline-start',
};
export function logicalProperty(physicalProp, direction) {
    const map = direction === 'rtl' ? RTL_MAP : LTR_MAP;
    return map[physicalProp] ?? physicalProp;
}
export function generateRTLOverrides() {
    return `:host([dir="rtl"]) {
  direction: rtl;
  text-align: right;
}
:host([dir="rtl"]) .shell-sidebar {
  border-right: none;
  border-inline-start: 1px solid #292524;
}
:host([dir="rtl"]) .shell-nav__item {
  text-align: right;
  margin-inline-start: 0;
  margin-inline-end: auto;
}
:host([dir="rtl"]) .shell-nav__icon {
  margin-inline-end: 10px;
  margin-inline-start: 0;
}`;
}
//# sourceMappingURL=rtl-utils.js.map