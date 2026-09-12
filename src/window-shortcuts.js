const WINDOW_SHORTCUTS = Object.freeze({
  moveLeft: { label: 'Move left', accelerator: 'CommandOrControl+Alt+Left' },
  moveRight: { label: 'Move right', accelerator: 'CommandOrControl+Alt+Right' },
  moveUp: { label: 'Move up', accelerator: 'CommandOrControl+Alt+Up' },
  moveDown: { label: 'Move down', accelerator: 'CommandOrControl+Alt+Down' },
  narrower: { label: 'Narrower', accelerator: 'CommandOrControl+Alt+Shift+Left' },
  wider: { label: 'Wider', accelerator: 'CommandOrControl+Alt+Shift+Right' },
  shorter: { label: 'Shorter', accelerator: 'CommandOrControl+Alt+Shift+Up' },
  taller: { label: 'Taller', accelerator: 'CommandOrControl+Alt+Shift+Down' },
  expand: { label: 'Expand / restore', accelerator: 'CommandOrControl+Alt+Return' },
  center: { label: 'Center on screen', accelerator: 'CommandOrControl+Alt+C' },
});

function registerWindowShortcuts(globalShortcut, onCommand) {
  return Object.fromEntries(Object.entries(WINDOW_SHORTCUTS).map(([action, { accelerator }]) => {
    let registered = false;
    try { registered = globalShortcut.register(accelerator, () => onCommand(action)); } catch (_) {}
    return [action, registered];
  }));
}

module.exports = { WINDOW_SHORTCUTS, registerWindowShortcuts };
