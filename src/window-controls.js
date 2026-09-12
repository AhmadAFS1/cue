// Geometry is kept separate from Electron so display edges and restore behavior
// can be exercised without moving the user's windows.
const MIN_WIDTH = 500;
const MIN_HEIGHT = 480;
const STEP = 40;
const DEFAULT_SIZE = { width: 700, height: 600 };

function finite(value, fallback) {
  return Number.isFinite(value) ? Math.round(value) : fallback;
}

function fitBounds(bounds, area) {
  const width = Math.min(area.width, Math.max(MIN_WIDTH, finite(bounds.width, DEFAULT_SIZE.width)));
  const height = Math.min(area.height, Math.max(MIN_HEIGHT, finite(bounds.height, DEFAULT_SIZE.height)));
  return {
    x: Math.max(area.x, Math.min(finite(bounds.x, area.x), area.x + area.width - width)),
    y: Math.max(area.y, Math.min(finite(bounds.y, area.y), area.y + area.height - height)),
    width,
    height,
  };
}

function initialBounds(settings, area) {
  return fitBounds({
    x: settings.windowX ?? area.x + Math.round((area.width - DEFAULT_SIZE.width) / 2),
    y: settings.windowY ?? area.y + 6,
    width: settings.windowWidth,
    height: settings.windowHeight,
  }, area);
}

class WindowControls {
  constructor({ getWindow, getWorkArea, save, onChange, settings = {} }) {
    Object.assign(this, { getWindow, getWorkArea, save, onChange });
    this.restoreBounds = settings.windowExpanded && settings.windowRestoreBounds
      ? settings.windowRestoreBounds : null;
    this.resizeOrigin = null;
  }

  getState() {
    const win = this.getWindow();
    return { bounds: win.getBounds(), expanded: !!this.restoreBounds };
  }

  persist() {
    const { bounds, expanded } = this.getState();
    this.save({ windowX: bounds.x, windowY: bounds.y, windowWidth: bounds.width,
      windowHeight: bounds.height, windowExpanded: expanded, windowRestoreBounds: this.restoreBounds });
    this.onChange(this.getState());
  }

  apply(bounds) {
    const win = this.getWindow();
    const next = fitBounds(bounds, this.getWorkArea(win.getBounds()));
    // setBounds never activates or focuses the window, so the foreground app
    // keeps focus when a global shortcut moves/resizes the overlay.
    win.setBounds(next, false);
    this.persist();
    return this.getState();
  }

  command(action) {
    const bounds = this.getWindow().getBounds();
    const area = this.getWorkArea(bounds);
    const moves = { moveLeft: [-STEP, 0], moveRight: [STEP, 0], moveUp: [0, -STEP], moveDown: [0, STEP] };
    const sizes = { narrower: [-STEP, 0], wider: [STEP, 0], shorter: [0, -STEP], taller: [0, STEP] };
    if (moves[action]) {
      const [dx, dy] = moves[action];
      return this.apply({ ...bounds, x: bounds.x + dx, y: bounds.y + dy });
    }
    if (sizes[action]) {
      const [dw, dh] = sizes[action];
      this.restoreBounds = null;
      return this.apply({ ...bounds, width: bounds.width + dw, height: bounds.height + dh });
    }
    if (action === 'expand') {
      if (this.restoreBounds) {
        const restore = this.restoreBounds;
        this.restoreBounds = null;
        return this.apply(restore);
      }
      this.restoreBounds = { ...bounds };
      const width = Math.min(area.width, Math.max(bounds.width, Math.min(1100, Math.round(area.width * 0.9))));
      const height = Math.min(area.height, Math.max(bounds.height, Math.round(area.height * 0.9)));
      return this.apply({ width, height, x: area.x + Math.round((area.width - width) / 2),
        y: area.y + Math.round((area.height - height) / 2) });
    }
    if (action === 'center') {
      return this.apply({ ...bounds, x: area.x + Math.round((area.width - bounds.width) / 2),
        y: area.y + Math.round((area.height - bounds.height) / 2) });
    }
    throw new Error('Unknown window action.');
  }

  beginResize(point) {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
    this.resizeOrigin = { ...point, bounds: this.getWindow().getBounds() };
    this.restoreBounds = null;
  }

  resizeTo(point) {
    const start = this.resizeOrigin;
    if (!start || !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
    return this.apply({ ...start.bounds, width: start.bounds.width + point.x - start.x,
      height: start.bounds.height + point.y - start.y });
  }

  endResize() { this.resizeOrigin = null; }
}

module.exports = { WindowControls, fitBounds, initialBounds, MIN_WIDTH, MIN_HEIGHT, STEP };
