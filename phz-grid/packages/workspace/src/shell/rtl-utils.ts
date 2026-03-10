/**
 * @phozart/phz-workspace — RTL Utilities (L.18)
 *
 * Pure functions for RTL layout support.
 * Maps physical CSS properties to logical properties and
 * generates RTL override CSS blocks.
 */

import type { I18nProvider } from '../i18n/i18n-provider.js';

export interface DirectionConfig {
  direction: 'ltr' | 'rtl';
  textAlign: 'left' | 'right';
  flexDirection: 'row' | 'row-reverse';
}

export function resolveDirection(i18n?: I18nProvider): 'ltr' | 'rtl' {
  return i18n?.direction ?? 'ltr';
}

const LTR_MAP: Record<string, string> = {
  'margin-left': 'margin-inline-start',
  'margin-right': 'margin-inline-end',
  'padding-left': 'padding-inline-start',
  'padding-right': 'padding-inline-end',
  'border-left': 'border-inline-start',
  'border-right': 'border-inline-end',
  'left': 'inset-inline-start',
  'right': 'inset-inline-end',
};

const RTL_MAP: Record<string, string> = {
  'margin-left': 'margin-inline-end',
  'margin-right': 'margin-inline-start',
  'padding-left': 'padding-inline-end',
  'padding-right': 'padding-inline-start',
  'border-left': 'border-inline-end',
  'border-right': 'border-inline-start',
  'left': 'inset-inline-end',
  'right': 'inset-inline-start',
};

export function logicalProperty(
  physicalProp: string,
  direction: 'ltr' | 'rtl',
): string {
  const map = direction === 'rtl' ? RTL_MAP : LTR_MAP;
  return map[physicalProp] ?? physicalProp;
}

export function generateRTLOverrides(): string {
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
