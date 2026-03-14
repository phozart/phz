# UX-T1B2 Architecture Spec — Copy Feedback Toast Enhancement

**Batch**: T1-B2
**Items**: UX-006
**Status**: ACTIVE

---

## UX-006: Copy Feedback Toast

### Current State

The grid already has a working toast system:

- `ToastController` manages state (`toast: ToastInfo | null`) with auto-dismiss (2500ms)
- `ClipboardController` calls `toast.show('Cell copied', 'success')` on copy operations
- `ExportController` calls `toast.show('Exported to Excel', 'success')` on export
- Template renders `<div class="phz-toast">` with `role="alert" aria-live="assertive"`
- CSS: fixed bottom-center, fade-in-up animation, dark theme support, reduced-motion

### Enhancement

Enhance `ToastController` with optional metadata (icon, duration, dismissible) to provide richer visual feedback. The icon gives an immediate visual signal of what happened (clipboard icon for copy, download icon for export, checkmark for success).

### Design Decisions

1. **Generic, not copy-specific** — Toast metadata (icon, duration, dismissible) benefits all toast uses, not just copy
2. **Backward compatible** — `show(message, type)` still works; options is an optional third parameter
3. **Icons as inline SVG** — No icon library dependency; small SVG paths inline in the template. Keeps bundle tiny.
4. **Icon is decorative** — `aria-hidden="true"` on icon; the message alone must be sufficient for screen readers
5. **Dismissible is opt-in** — By default toasts auto-dismiss. Only long-duration or error toasts should be manually dismissible.

### Interface Changes

```typescript
// Before
export interface ToastInfo {
  message: string;
  type: 'success' | 'info' | 'error';
}

// After
export interface ToastOptions {
  icon?: 'copy' | 'export' | 'check' | 'error' | 'info';
  duration?: number; // Override default 2500ms
  dismissible?: boolean; // Show close button
}

export interface ToastInfo {
  message: string;
  type: 'success' | 'info' | 'error';
  icon?: 'copy' | 'export' | 'check' | 'error' | 'info';
  duration?: number;
  dismissible?: boolean;
}
```

### Method Signature

```typescript
// Before
show(message: string, type: 'success' | 'info' | 'error' = 'info'): void

// After (backward compatible)
show(message: string, type: 'success' | 'info' | 'error' = 'info', options?: ToastOptions): void
```

### Icon SVG Paths

Minimal 16x16 SVG icons rendered inline:

- `copy`: Two overlapping rectangles (standard clipboard icon)
- `export`: Arrow pointing down into tray
- `check`: Checkmark
- `error`: Circle with exclamation
- `info`: Circle with "i"

### Template Update

```html
<div class="phz-toast phz-toast--{type}" role="alert" aria-live="assertive">
  {icon SVG with aria-hidden="true"}
  <span class="phz-toast__message">{message}</span>
  {if dismissible: <button class="phz-toast__close" aria-label="Dismiss">×</button>}
</div>
```

### CSS Additions

- `.phz-toast__icon` — 16x16 flex-shrink:0, color inherits from toast type
- `.phz-toast__message` — flex:1 for text
- `.phz-toast__close` — 20x20 button, transparent bg, hover state
- `.phz-toast--success .phz-toast__icon` — green tint
- `.phz-toast--error .phz-toast__icon` — red tint
- `.phz-toast--info .phz-toast__icon` — blue tint
- Icon pulse animation on appear (600ms, respects prefers-reduced-motion)

### Files to Modify

| File                                           | Change                                                                             |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| `grid/src/controllers/toast.controller.ts`     | Add `ToastOptions`, extend `ToastInfo`, update `show()` signature, add `dismiss()` |
| `grid/src/controllers/clipboard.controller.ts` | Pass `{ icon: 'copy' }` in all toast calls                                         |
| `grid/src/controllers/export.controller.ts`    | Pass `{ icon: 'export' }` in toast calls                                           |
| `grid/src/components/phz-grid.ts`              | Update toast template to render icon + close button                                |
| `grid/src/components/phz-grid.styles.ts`       | Add icon/close CSS, type-based icon colors                                         |
| `grid/src/controllers/index.ts`                | Export `ToastOptions` type                                                         |

### Files to Create

| File                                          | Purpose                    | Tests     |
| --------------------------------------------- | -------------------------- | --------- |
| `grid/src/__tests__/toast-controller.test.ts` | ToastController unit tests | ~18 tests |

### Accessibility

- Icon has `aria-hidden="true"` (decorative, message is standalone)
- Close button has `aria-label="Dismiss"`
- Existing `role="alert"` and `aria-live="assertive"` preserved
- Reduced motion: icon animation disabled via existing `@media (prefers-reduced-motion)`

### Test Plan

1. ToastController: show with defaults, show with icon, show with custom duration, dismiss(), auto-dismiss timing, dismiss clears toast, backward compat (no options)
2. ClipboardController: verify toast calls include `{ icon: 'copy' }`
3. ExportController: verify toast calls include `{ icon: 'export' }`
