/**
 * Component Patterns — Helpers for form density, modals, drawers, empty states,
 * loading skeletons, status badges, and overflow prevention.
 *
 * Extracted from @phozart/workspace styles (S.7).
 * Pure functions and constants only — no Lit/CSS dependencies.
 */

// ========================================================================
// Form Density
// ========================================================================

export interface FormDensityClasses {
  label: string;
  input: string;
  toggle: string;
}

/**
 * Get CSS class names for form elements at a given density.
 *
 * @param density - Form density mode
 * @returns Object with class names for label, input, and toggle elements
 */
export function getFormDensityClasses(density: 'compact' | 'default'): FormDensityClasses {
  return {
    label: `form-label--${density}`,
    input: `form-input--${density}`,
    toggle: `form-toggle--${density}`,
  };
}

// ========================================================================
// Modal
// ========================================================================

export interface ModalClasses {
  backdrop: string;
  container: string;
}

/**
 * Get CSS class names for a modal dialog.
 *
 * @param options - Modal state (open/closed)
 * @returns Object with class names for backdrop and container
 */
export function getModalClasses(options: { open: boolean }): ModalClasses {
  const backdropBase = 'modal-backdrop';
  return {
    backdrop: options.open
      ? `${backdropBase} modal-backdrop--visible`
      : backdropBase,
    container: 'modal-container',
  };
}

// ========================================================================
// Drawer
// ========================================================================

export const DRAWER_DEFAULTS = {
  width: 400,
  maxWidth: 560,
} as const;

export interface DrawerClasses {
  drawer: string;
}

/**
 * Get CSS class names for a slide-over drawer.
 *
 * @param options - Drawer state and position
 * @returns Object with the drawer class string
 */
export function getDrawerClasses(options: { open: boolean; position: 'left' | 'right' }): DrawerClasses {
  const parts = [`drawer drawer--${options.position}`];
  if (options.open) parts.push('drawer--open');
  return { drawer: parts.join(' ') };
}

// ========================================================================
// Empty States
// ========================================================================

export interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
}

const EMPTY_STATE_MAP: Record<string, EmptyStateProps> = {
  'no-data': {
    icon: '\u25CB',
    title: 'No data available',
    description: 'There is no data to display. Try adjusting your filters or adding a data source.',
    ctaLabel: 'Add Data Source',
  },
  'no-results': {
    icon: '\u2315',
    title: 'No results found',
    description: 'Your search did not match any items. Try a different query.',
    ctaLabel: 'Clear Search',
  },
  'no-selection': {
    icon: '\u25A1',
    title: 'Nothing selected',
    description: 'Select an item from the list to view its details.',
  },
  'empty-dashboard': {
    icon: '\u25A6',
    title: 'Start building',
    description: 'Drag widgets from the palette or choose a template to get started.',
    ctaLabel: 'Browse Templates',
  },
};

/**
 * Get display properties for an empty state by its type key.
 * Falls back to a generic "Nothing here yet" if the type is unknown.
 *
 * @param stateType - Empty state type key
 * @returns Icon, title, description, and optional CTA label
 */
export function getEmptyStateProps(stateType: string): EmptyStateProps {
  return EMPTY_STATE_MAP[stateType] ?? {
    icon: '\u25CB',
    title: 'Nothing here yet',
    description: 'Content will appear here when available.',
  };
}

// ========================================================================
// Loading Skeletons
// ========================================================================

/**
 * Get CSS class for a loading skeleton placeholder.
 *
 * @param variant - Skeleton variant
 * @returns CSS class string
 */
export function getSkeletonClass(variant: 'text' | 'card' | 'chart' | 'table'): string {
  return `skeleton skeleton--${variant}`;
}

// ========================================================================
// Status Badge Variants
// ========================================================================

export interface BadgeVariant {
  bgColor: string;
  textColor: string;
  label: string;
}

export const STATUS_BADGE_VARIANTS: Record<string, BadgeVariant> = {
  published: { bgColor: '#D1FAE5', textColor: '#065F46', label: 'Published' },
  shared: { bgColor: '#DBEAFE', textColor: '#1E40AF', label: 'Shared' },
  personal: { bgColor: '#F5F5F4', textColor: '#57534E', label: 'Personal' },
  draft: { bgColor: '#FEF3C7', textColor: '#92400E', label: 'Draft' },
  breach: { bgColor: '#FEE2E2', textColor: '#991B1B', label: 'Breach' },
  processing: { bgColor: '#E0E7FF', textColor: '#3730A3', label: 'Processing' },
};

// ========================================================================
// Overflow Prevention
// ========================================================================

export interface OverflowClasses {
  truncate: string;
  minWidth: string;
  wordBreak: string;
}

/**
 * Get CSS utility class names for preventing text overflow in grid cells
 * and widget content areas.
 */
export function getOverflowClasses(): OverflowClasses {
  return {
    truncate: 'text-truncate',
    minWidth: 'min-w-0',
    wordBreak: 'word-break',
  };
}
