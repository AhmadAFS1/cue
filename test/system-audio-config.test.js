const assert = require('node:assert/strict');
const test = require('node:test');
const { buildDisplayMediaGrant, displayMediaHandlerOptions } = require('../src/display-media');

test('Windows uses a direct Electron system-audio loopback grant', () => {
  const source = { id: 'screen:1:0', name: 'Screen 1' };
  assert.deepEqual(buildDisplayMediaGrant(source), { video: source, audio: 'loopback' });
  assert.deepEqual(displayMediaHandlerOptions('win32'), { useSystemPicker: false });
});

test('macOS prefers the native picker and retains loopback as its fallback', () => {
  const source = { id: 'screen:1:0', name: 'Screen 1' };
  assert.deepEqual(displayMediaHandlerOptions('darwin'), { useSystemPicker: true });
  assert.equal(buildDisplayMediaGrant(source).audio, 'loopback');
});
