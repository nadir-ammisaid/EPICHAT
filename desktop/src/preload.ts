import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  notify: (title: string, body: string): Promise<boolean> =>
    ipcRenderer.invoke("notify", title, body),
});
