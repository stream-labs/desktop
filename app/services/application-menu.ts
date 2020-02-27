import { Service, Inject } from 'services/core';
import electron from 'electron';
import { EditorCommandsService } from './editor-commands';
import { ClipboardService } from './clipboard';
import { OS } from 'util/operating-systems';
import { SelectionService } from './selection';
import { AppService } from './app';

/**
 * Manages the application menuy and shortcuts on Mac OS
 */
export class ApplicationMenuService extends Service {
  @Inject() editorCommandsService: EditorCommandsService;
  @Inject() clipboardService: ClipboardService;
  @Inject() selectionService: SelectionService;
  @Inject() appService: AppService;

  init() {
    if (process.platform !== OS.Mac) return;

    const menu = this.buildMenu();
    electron.remote.Menu.setApplicationMenu(menu);

    this.bindDynamicMenuItems();
  }

  buildMenu(): electron.Menu {
    // TODO: i18n
    return electron.remote.Menu.buildFromTemplate([
      { role: 'appMenu' },
      { role: 'fileMenu' },
      {
        id: 'edit',
        label: 'Edit',
        submenu: [
          {
            id: 'undo',
            label: 'Undo',
            accelerator: 'Command+Z',
            click: () => {
              this.editorCommandsService.undo();
            },
          },
          {
            id: 'redo',
            label: 'Redo',
            accelerator: 'Command+Shift+Z',
            click: () => {
              this.editorCommandsService.redo();
            },
          },
          { type: 'separator' },
          {
            id: 'copy',
            label: 'Copy',
            accelerator: 'Command+C',
            click: () => {
              this.clipboardService.copy();
            },
          },
          {
            id: 'paste',
            label: 'Paste',
            accelerator: 'Command+V',
            click: () => {
              this.clipboardService.paste();
            },
          },
          {
            id: 'delete',
            label: 'Delete',
            click: () => {
              this.selectionService.remove();
            },
          },
          {
            label: 'Select All',
            accelerator: 'Command+A',
            click: () => {
              this.selectionService.selectAll();
            },
          },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }],
          },
        ],
      },
      {
        label: 'View',
        submenu: [{ role: 'togglefullscreen' }],
      },
      { role: 'windowMenu' },
      {
        label: 'Help',
        role: 'help',
        submenu: [
          {
            label: 'Streamlabs OBS Support',
            click: () => {
              electron.remote.shell.openExternal('https://support.streamlabs.com');
            },
          },
        ],
      },
    ]);
  }

  bindDynamicMenuItems() {
    const appMenu = electron.remote.Menu.getApplicationMenu();

    this.editorCommandsService.undoHistorySize.subscribe(sizes => {
      appMenu.getMenuItemById('undo').enabled = !!sizes.undoLength;
      appMenu.getMenuItemById('redo').enabled = !!sizes.redoLength;
    });

    this.selectionService.updated.subscribe(state => {
      appMenu.getMenuItemById('copy').enabled = !!state.selectedIds.length;
      appMenu.getMenuItemById('delete').enabled = !!state.selectedIds.length;
    });
  }
}
