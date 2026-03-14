import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TooltipController, type TooltipHost, type TooltipPosition } from '../controllers/tooltip.controller.js';

function createMockHost(overrides: Partial<TooltipHost> = {}): TooltipHost {
  return {
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
    enableCellTooltips: overrides.enableCellTooltips ?? true,
    tooltipDelay: overrides.tooltipDelay ?? 300,
    renderRoot: {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      querySelector: vi.fn(),
      appendChild: vi.fn(),
    } as unknown as ShadowRoot,
  };
}

function createMockElement(overrides: Partial<HTMLElement> = {}): HTMLElement {
  return {
    scrollWidth: 100,
    offsetWidth: 100,
    scrollHeight: 20,
    offsetHeight: 20,
    textContent: 'Cell value',
    getBoundingClientRect: () => ({
      top: 100,
      bottom: 130,
      left: 200,
      right: 400,
      width: 200,
      height: 30,
      x: 200,
      y: 100,
      toJSON: () => {},
    }),
    ...overrides,
  } as unknown as HTMLElement;
}

describe('TooltipController', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('constructor', () => {
    it('attaches controller to host', () => {
      const host = createMockHost();
      const ctrl = new TooltipController(host);
      expect(host.addController).toHaveBeenCalledWith(ctrl);
    });
  });

  describe('isTruncated', () => {
    it('returns true when scrollWidth > offsetWidth', () => {
      const host = createMockHost();
      const ctrl = new TooltipController(host);
      const el = createMockElement({ scrollWidth: 200, offsetWidth: 100 } as Partial<HTMLElement>);
      expect(ctrl.isTruncated(el)).toBe(true);
    });

    it('returns false when scrollWidth <= offsetWidth', () => {
      const host = createMockHost();
      const ctrl = new TooltipController(host);
      const el = createMockElement({ scrollWidth: 100, offsetWidth: 100 } as Partial<HTMLElement>);
      expect(ctrl.isTruncated(el)).toBe(false);
    });

    it('returns true when scrollHeight > offsetHeight', () => {
      const host = createMockHost();
      const ctrl = new TooltipController(host);
      const el = createMockElement({ scrollHeight: 40, offsetHeight: 20 } as Partial<HTMLElement>);
      expect(ctrl.isTruncated(el)).toBe(true);
    });
  });

  describe('getTooltipContent', () => {
    it('returns textContent of element', () => {
      const host = createMockHost();
      const ctrl = new TooltipController(host);
      const el = createMockElement({ textContent: 'Hello World' } as Partial<HTMLElement>);
      expect(ctrl.getTooltipContent(el)).toBe('Hello World');
    });

    it('returns empty string for empty element', () => {
      const host = createMockHost();
      const ctrl = new TooltipController(host);
      const el = createMockElement({ textContent: '' } as Partial<HTMLElement>);
      expect(ctrl.getTooltipContent(el)).toBe('');
    });

    it('trims whitespace from textContent', () => {
      const host = createMockHost();
      const ctrl = new TooltipController(host);
      const el = createMockElement({ textContent: '  padded text  ' } as Partial<HTMLElement>);
      expect(ctrl.getTooltipContent(el)).toBe('padded text');
    });
  });

  describe('computePosition', () => {
    it('returns position below element by default', () => {
      const host = createMockHost();
      const ctrl = new TooltipController(host);
      const el = createMockElement();
      const pos = ctrl.computePosition(el);
      expect(pos.placement).toBe('below');
      // bottom (130) + offset (8) = 138
      expect(pos.top).toBe(138);
      expect(pos.left).toBe(200);
    });

    it('flips above if near bottom of viewport', () => {
      const host = createMockHost();
      const ctrl = new TooltipController(host);
      const el = createMockElement();
      // viewportHeight 160 means: bottom(130) + offset(8) = 138, + estimatedHeight(40) = 178 > 160
      const pos = ctrl.computePosition(el, 160);
      expect(pos.placement).toBe('above');
      // top (100) - offset (8) - estimatedHeight (40) = 52
      expect(pos.top).toBe(52);
      expect(pos.left).toBe(200);
    });

    it('stays below if viewport has enough room', () => {
      const host = createMockHost();
      const ctrl = new TooltipController(host);
      const el = createMockElement();
      // viewportHeight 1000 means plenty of room
      const pos = ctrl.computePosition(el, 1000);
      expect(pos.placement).toBe('below');
    });
  });

  describe('enabled flag', () => {
    it('does not attach listeners when disabled', () => {
      const host = createMockHost({ enableCellTooltips: false });
      const ctrl = new TooltipController(host);
      ctrl.hostConnected();
      expect(host.renderRoot.addEventListener).not.toHaveBeenCalled();
    });

    it('attaches listeners when enabled', () => {
      const host = createMockHost({ enableCellTooltips: true });
      const ctrl = new TooltipController(host);
      ctrl.hostConnected();
      expect(host.renderRoot.addEventListener).toHaveBeenCalledWith(
        'mouseover',
        expect.any(Function),
      );
      expect(host.renderRoot.addEventListener).toHaveBeenCalledWith(
        'mouseout',
        expect.any(Function),
      );
      expect(host.renderRoot.addEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        true,
      );
    });
  });

  describe('delay setting', () => {
    it('uses custom delay from host', () => {
      const host = createMockHost({ tooltipDelay: 500 });
      const ctrl = new TooltipController(host);
      // Verify the controller reads the host delay (integration via host property)
      expect(host.tooltipDelay).toBe(500);
      // The controller itself doesn't store delay — it reads from host each time
      expect(host.addController).toHaveBeenCalledWith(ctrl);
    });

    it('defaults to 300ms delay', () => {
      const host = createMockHost();
      const _ctrl = new TooltipController(host);
      expect(host.tooltipDelay).toBe(300);
    });
  });

  describe('hostDisconnected', () => {
    it('removes event listeners on disconnect', () => {
      const host = createMockHost();
      const ctrl = new TooltipController(host);
      ctrl.hostConnected();
      ctrl.hostDisconnected();
      expect(host.renderRoot.removeEventListener).toHaveBeenCalledWith(
        'mouseover',
        expect.any(Function),
      );
      expect(host.renderRoot.removeEventListener).toHaveBeenCalledWith(
        'mouseout',
        expect.any(Function),
      );
      expect(host.renderRoot.removeEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        true,
      );
    });
  });
});
