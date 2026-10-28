const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("quantimation", {
  settings: () => ipcRenderer.invoke("settings:get"),
  saveSettings: (value) => ipcRenderer.invoke("settings:set", value),
  testConnection: () => ipcRenderer.invoke("model:test"),
  generate: (request) => ipcRenderer.invoke("episode:generate", request),
  createAsset: (brief) => ipcRenderer.invoke("asset:generate", brief),
  cancel: () => ipcRenderer.invoke("generation:cancel"),
  speech: (text) => ipcRenderer.invoke("speech:render", text),
  saveProject: (episode) => ipcRenderer.invoke("project:save", episode),
  openProject: () => ipcRenderer.invoke("project:open"),
  saveVideo: (bytes, title, automatic = false, subtitles = "") =>
    ipcRenderer.invoke("video:save", bytes, title, automatic, subtitles),
  onMcpRequest: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("mcp:request", listener);
    return () => ipcRenderer.removeListener("mcp:request", listener);
  },
  mcpRespond: (id, response) =>
    ipcRenderer.invoke("mcp:response", id, response),
  onProgress: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("generation:progress", listener);
    return () => ipcRenderer.removeListener("generation:progress", listener);
  },
});
