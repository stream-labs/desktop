import { ipcRenderer } from 'electron';

/**
 * A wrapper class for calling IPC from the renderer process to the main process and returning it with type specified.
 */
export class IPCWrapper {
  static getLatestObsLog(): { filename: string; data: string } {
    return ipcRenderer.sendSync('get-latest-obs-log');
  }

  static getObsPluginFilesList(): { path: string; files: string[] } {
    return ipcRenderer.sendSync('get-obs-plugin-files-list');
  }

  static getCpuModel(): string {
    return ipcRenderer.sendSync('get-cpu-model');
  }
}
