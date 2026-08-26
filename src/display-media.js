// Platform-specific display-media policy kept separate from Electron wiring so
// it can be tested on either build host.

function buildDisplayMediaGrant(source) {
  if (!source) return {};
  return { video: source, audio: 'loopback' };
}

function displayMediaHandlerOptions(platform = process.platform) {
  // macOS 15+ needs the native picker to start its system-audio capture/TCC
  // flow reliably. On older macOS versions Electron falls back to our handler.
  // Windows should skip the picker and bind directly to its loopback device.
  return { useSystemPicker: platform === 'darwin' };
}

module.exports = { buildDisplayMediaGrant, displayMediaHandlerOptions };
