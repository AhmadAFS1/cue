const { contextBridge, ipcRenderer } = require('electron');
const platform = process.platform;

contextBridge.exposeInMainWorld('cue', {
  platform,
  settingsGet: () => ipcRenderer.invoke('settings:get'),
  settingsSet: (patch) => ipcRenderer.invoke('settings:set', patch),
  windowState: () => ipcRenderer.invoke('window:state'),
  windowCommand: (action) => ipcRenderer.invoke('window:command', action),
  windowShortcuts: () => ipcRenderer.invoke('window:shortcuts'),
  windowResizeStart: (point) => ipcRenderer.send('window:resize-start', point),
  windowResizeMove: (point) => ipcRenderer.send('window:resize-move', point),
  windowResizeEnd: () => ipcRenderer.send('window:resize-end'),
  whisperModels: () => ipcRenderer.invoke('whisper:models'),
  whisperModelDownload: (modelId) => ipcRenderer.invoke('whisper:model-download', modelId),
  whisperModelCancel: (modelId) => ipcRenderer.invoke('whisper:model-cancel', modelId),
  whisperModelDelete: (modelId) => ipcRenderer.invoke('whisper:model-delete', modelId),
  whisperModelImport: (modelId) => ipcRenderer.invoke('whisper:model-import', modelId),
  platformInfo: () => ipcRenderer.invoke('platform:info'),
  ask: (payload) => ipcRenderer.send('ask', payload),
  captureToggle: () => ipcRenderer.invoke('capture:toggle').catch((err) => {
    console.error('[cue] captureToggle error', err);
    return false;
  }),
  captureState: () => ipcRenderer.invoke('capture:state'),
  micPcm: (arrayBuffer) => ipcRenderer.send('mic:pcm', arrayBuffer),
  systemPcm: (arrayBuffer) => ipcRenderer.send('system:pcm', arrayBuffer),
  setIgnoreMouse: (v) => ipcRenderer.send('mouse:ignore', v),
  clearTranscript: () => ipcRenderer.invoke('transcript:clear'),
  openPane: (url) => ipcRenderer.send('open-pane', url),
  appLinkState: () => ipcRenderer.invoke('applink:state'),
  appLinkRevoke: (callerId) => ipcRenderer.invoke('applink:revoke', callerId),
  appLinkConsentRespond: (id, allowed) => ipcRenderer.send('applink:consent-response', { id, allowed }),
  importResumes: (supporting = false) => ipcRenderer.invoke('resumes:import', supporting),
  selectResume: (id) => ipcRenderer.invoke('resumes:select', id),
  pickProfileDocument: () => ipcRenderer.invoke('profile:pickDocument'),
  quit: () => ipcRenderer.send('app:quit'),
  permissionsCheck: () => ipcRenderer.invoke('permissions:check'),
  permissionsRequest: () => ipcRenderer.invoke('permissions:request'),
  permissionsRestart: () => ipcRenderer.send('permissions:restart'),
  permissionsContinue: () => ipcRenderer.send('permissions:continue'),
  log: (msg) => ipcRenderer.send('log', msg),
  on: (channel, cb) => {
    const allowed = ['capture:state', 'llm:start', 'llm:token', 'llm:done', 'llm:error', 'status', 'transcript', 'stt:interim', 'stt:final', 'stt:status', 'vad:state', 'applink:consent-request', 'hide:toggle', 'whisper:download-progress', 'whisper:models-changed'];
    if (!allowed.includes(channel) && !['window:state', 'panel:show'].includes(channel)) return;
    ipcRenderer.on(channel, (_e, data) => cb(data));
  }
});
