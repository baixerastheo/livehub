import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  setBadge: (count: number) => ipcRenderer.send('set-badge', count),
});
