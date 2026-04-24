"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    saveFile: (content, defaultName, filters) => electron_1.ipcRenderer.invoke("save-file", { content, defaultName, filters }),
    openFile: (filters) => electron_1.ipcRenderer.invoke("open-file", { filters }),
    getAppInfo: () => electron_1.ipcRenderer.invoke("get-app-info"),
    getGpuInfo: () => electron_1.ipcRenderer.invoke("get-gpu-info"),
    getSystemInfo: () => electron_1.ipcRenderer.invoke("get-system-info"),
    checkForUpdates: () => electron_1.ipcRenderer.invoke("check-for-updates"),
    downloadUpdate: () => electron_1.ipcRenderer.invoke("download-update"),
    getUpdateSettings: () => electron_1.ipcRenderer.invoke("get-update-settings"),
    setUpdateSettings: (settings) => electron_1.ipcRenderer.invoke("set-update-settings", settings),
    getUpdateHistory: () => electron_1.ipcRenderer.invoke("get-update-history"),
    onUpdateAvailable: (callback) => {
        electron_1.ipcRenderer.on("update-available", (_event, data) => callback(data));
    },
    onUpdateDownloadProgress: (callback) => {
        electron_1.ipcRenderer.on("update-download-progress", (_event, data) => callback(data));
    },
    onUpdateDownloaded: (callback) => {
        electron_1.ipcRenderer.on("update-downloaded", (_event, data) => callback(data));
    },
    onUpdateError: (callback) => {
        electron_1.ipcRenderer.on("update-error", (_event, data) => callback(data));
    },
    onUpdateNotAvailable: (callback) => {
        electron_1.ipcRenderer.on("update-not-available", () => callback());
    },
    quitAndInstall: () => electron_1.ipcRenderer.invoke("quit-and-install"),
    onUpdateCountdown: (callback) => {
        electron_1.ipcRenderer.on("update-countdown", (_event, data) => callback(data));
    },
    getLiveHardware: () => electron_1.ipcRenderer.invoke("get-live-hardware"),
    showNotification: (title, message) => electron_1.ipcRenderer.send("show-notification", { title, message }),
    isElectron: true,
    apiBaseUrl: `http://localhost:3001`,
});
//# sourceMappingURL=preload.js.map