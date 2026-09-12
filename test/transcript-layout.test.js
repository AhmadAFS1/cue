const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');

test('conversation history is docked within the panel layout', () => {
  const html = fs.readFileSync(path.join(root, 'renderer', 'index.html'), 'utf8');
  const columns = html.indexOf('<div id="panel-columns">');
  const sidebar = html.indexOf('<aside id="transcript-sidebar"');
  const columnsEnd = html.indexOf('</div><!-- /panel-columns -->');
  assert.ok(columns >= 0 && sidebar > columns && sidebar < columnsEnd,
    'history must be a child of panel-columns, not a floating sibling');
});

test('docked history has a narrow-window stacked layout', () => {
  const css = fs.readFileSync(path.join(root, 'renderer', 'styles.css'), 'utf8');
  assert.match(css, /\.transcript-sidebar\s*\{[\s\S]*?flex:\s*0 1 clamp\(180px, 34%, 280px\)/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*?#panel-columns\s*\{\s*flex-direction:\s*column/);
  assert.doesNotMatch(css, /#panel-wrap\.sidebar-open\s*\{[\s\S]*?transform:/);
});

test('transcript labels distinguish microphone and system-audio sources', () => {
  const renderer = fs.readFileSync(path.join(root, 'renderer', 'renderer.js'), 'utf8');
  assert.match(renderer, /Me · microphone/);
  assert.match(renderer, /Other person · system audio/);
  assert.match(renderer, /const tsSidebarInterimEls = \{ you: null, them: null \}/);
});
