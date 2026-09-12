const WINDOW_SHORTCUTS = Object.freeze({
  moveLeft: { label: 'Move left', accelerator: 'Control+Alt+Left' },
  moveRight: { label: 'Move right', accelerator: 'Control+Alt+Right' },
  moveUp: { label: 'Move up', accelerator: 'Control+Alt+Up' },
  moveDown: { label: 'Move down', accelerator: 'Control+Alt+Down' },
  narrower: { label: 'Narrower', accelerator: 'Control+Alt+Shift+Left' },
  wider: { label: 'Wider', accelerator: 'Control+Alt+Shift+Right' },
  shorter: { label: 'Shorter', accelerator: 'Control+Alt+Shift+Up' },
  taller: { label: 'Taller', accelerator: 'Control+Alt+Shift+Down' },
  expand: { label: 'Expand / restore', accelerator: 'Control+Alt+Return' },
  center: { label: 'Center on screen', accelerator: 'Control+Alt+C' },
});

function registerWindowShortcuts(globalShortcut, onCommand) {
  return Object.fromEntries(Object.entries(WINDOW_SHORTCUTS).map(([action, { accelerator }]) => {
    let registered = false;
    try { registered = globalShortcut.register(accelerator, () => onCommand(action)); } catch (_) {}
    return [action, registered];
  }));
}

function actionForKeyInput(input, platform = process.platform) {
  if (!input || input.type !== 'keyDown' || !input.alt) return null;
  if (!input.control) return null;

  const key = String(input.key || '').replace(/^Arrow/, '').toLowerCase();
  const arrows = input.shift
    ? { left: 'narrower', right: 'wider', up: 'shorter', down: 'taller' }
    : { left: 'moveLeft', right: 'moveRight', up: 'moveUp', down: 'moveDown' };
  if (arrows[key]) return arrows[key];
  if (input.shift) return null;
  if (key === 'c') return 'center';
  if (key === 'enter' || key === 'return') return 'expand';
  return null;
}

module.exports = { WINDOW_SHORTCUTS, registerWindowShortcuts, actionForKeyInput };
