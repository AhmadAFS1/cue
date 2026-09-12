const test = require('node:test');
const assert = require('node:assert/strict');
const { WindowControls, fitBounds, initialBounds } = require('../src/window-controls');
const { WINDOW_SHORTCUTS, registerWindowShortcuts, actionForKeyInput } = require('../src/window-shortcuts');

const area = { x: 0, y: 25, width: 1440, height: 850 };
function fixture(settings = {}, initial = { x: 200, y: 80, width: 700, height: 600 }) {
  let bounds = { ...initial };
  let saved;
  const changes = [];
  // No show/focus/activate methods: moving an overlay must not steal focus.
  const win = { getBounds: () => ({ ...bounds }), setBounds: (next) => { bounds = { ...next }; } };
  const controls = new WindowControls({ getWindow: () => win, getWorkArea: () => area,
    save: (patch) => { saved = patch; }, onChange: (state) => changes.push(state), settings });
  return { controls, getBounds: win.getBounds, getSaved: () => saved, changes };
}

test('saved bounds from a disconnected display are brought back into the work area', () => {
  assert.deepEqual(initialBounds({ windowX: -2000, windowY: 1800, windowWidth: 3000, windowHeight: 2000 }, area), area);
});

test('legacy settings get the normal size and malformed sizes cannot escape screen bounds', () => {
  const result = initialBounds({ windowX: null, windowY: null }, area);
  assert.equal(result.width, 700);
  assert.equal(result.height, 600);
  assert.deepEqual(fitBounds({ x: NaN, y: Infinity, width: -1, height: null }, area),
    { x: 0, y: 25, width: 500, height: 600 });
});

test('small and negative-origin displays can always contain the full window', () => {
  const small = { x: -400, y: -200, width: 400, height: 300 };
  assert.deepEqual(fitBounds({ x: 0, y: 0, width: 700, height: 600 }, small), small);
});

test('repeated moves stop at screen edges, retain size, and persist the actual position', () => {
  const f = fixture();
  for (let i = 0; i < 100; i++) f.controls.command('moveLeft');
  for (let i = 0; i < 100; i++) f.controls.command('moveUp');
  assert.deepEqual(f.getBounds(), { x: 0, y: 25, width: 700, height: 600 });
  assert.equal(f.getSaved().windowX, 0);
  assert.equal(f.getSaved().windowY, 25);
});

test('expand and restore round-trip the original size and position', () => {
  const f = fixture();
  const before = f.getBounds();
  assert.equal(f.controls.command('expand').expanded, true);
  assert.ok(f.getBounds().width > before.width);
  assert.ok(f.getBounds().height > before.height);
  assert.equal(f.controls.command('expand').expanded, false);
  assert.deepEqual(f.getBounds(), before);
  assert.equal(f.getSaved().windowRestoreBounds, null);
});

test('restore survives an application restart while expanded', () => {
  const f = fixture();
  const before = f.getBounds();
  f.controls.command('expand');
  const restarted = fixture(f.getSaved(), f.getBounds());
  restarted.controls.command('expand');
  assert.deepEqual(restarted.getBounds(), before);
});

test('resizing manually after expansion sets a new normal size', () => {
  const f = fixture();
  f.controls.command('expand');
  const expanded = f.getBounds();
  f.controls.command('narrower');
  assert.equal(f.getBounds().width, expanded.width - 40);
  assert.equal(f.controls.getState().expanded, false);
  const normal = f.getBounds();
  f.controls.command('expand');
  f.controls.command('expand');
  assert.deepEqual(f.getBounds(), normal);
});

test('resize grip uses a fixed pointer origin and respects minimum sizes', () => {
  const f = fixture();
  f.controls.beginResize({ x: 900, y: 680 });
  f.controls.resizeTo({ x: 920, y: 690 });
  f.controls.resizeTo({ x: 940, y: 700 });
  assert.equal(f.getBounds().width, 740);
  assert.equal(f.getBounds().height, 620);
  f.controls.resizeTo({ x: 0, y: 0 });
  assert.equal(f.getBounds().width, 500);
  assert.equal(f.getBounds().height, 480);
  f.controls.endResize();
  const after = f.getBounds();
  f.controls.resizeTo({ x: 1000, y: 1000 });
  assert.deepEqual(f.getBounds(), after);
});

test('invalid commands and pointer data do not move or resize the window', () => {
  const f = fixture();
  const before = f.getBounds();
  assert.throws(() => f.controls.command('other'), /Unknown window action/);
  f.controls.beginResize({ x: NaN, y: 1 });
  f.controls.resizeTo({ x: 2, y: 3 });
  assert.deepEqual(f.getBounds(), before);
});

test('global window shortcut collisions are visible and do not prevent other registrations', () => {
  const callbacks = new Map();
  const commands = [];
  const status = registerWindowShortcuts({ register(accelerator, callback) {
    if (accelerator === WINDOW_SHORTCUTS.expand.accelerator) return false;
    if (accelerator === WINDOW_SHORTCUTS.center.accelerator) throw new Error('reserved');
    callbacks.set(accelerator, callback);
    return true;
  } }, action => commands.push(action));
  assert.equal(status.expand, false);
  assert.equal(status.center, false);
  assert.equal(status.moveLeft, true);
  callbacks.get(WINDOW_SHORTCUTS.moveLeft.accelerator)();
  callbacks.get(WINDOW_SHORTCUTS.taller.accelerator)();
  assert.deepEqual(commands, ['moveLeft', 'taller']);
  assert.equal(new Set(Object.values(WINDOW_SHORTCUTS).map(s => s.accelerator)).size, 10);
});

test('focused key input maps the displayed movement and resize shortcuts', () => {
  assert.equal(actionForKeyInput({ type: 'keyDown', control: true, alt: true, key: 'ArrowLeft' }, 'darwin'), 'moveLeft');
  assert.equal(actionForKeyInput({ type: 'keyDown', control: true, alt: true, key: 'ArrowDown' }, 'darwin'), 'moveDown');
  assert.equal(actionForKeyInput({ type: 'keyDown', control: true, alt: true, shift: true, key: 'ArrowRight' }, 'darwin'), 'wider');
  assert.equal(actionForKeyInput({ type: 'keyDown', control: true, alt: true, key: 'ArrowUp' }, 'win32'), 'moveUp');
  assert.equal(actionForKeyInput({ type: 'keyDown', control: true, alt: true, key: 'c' }, 'win32'), 'center');
  assert.equal(actionForKeyInput({ type: 'keyDown', meta: true, alt: true, key: 'ArrowLeft' }, 'darwin'), null);
});
