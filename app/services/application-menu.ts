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
              if (this.appService.state.loading) return;
              this.editorCommandsService.undo();
            },
          },
          {
            id: 'redo',
            label: 'Redo',
            accelerator: 'Command+Shift+Z',
            click: () => {
              if (this.appService.state.loading) return;
              this.editorCommandsService.redo();
            },
          },
          { type: 'separator' },
          {
            id: 'copy',
            label: 'Copy',
            accelerator: 'Command+C',
            click: () => {
              if (this.appService.state.loading) return;
              this.clipboardService.copy();
            },
          },
          {
            id: 'paste',
            label: 'Paste',
            accelerator: 'Command+V',
            click: () => {
              if (this.appService.state.loading) return;
              this.clipboardService.paste();
            },
          },
          {
            id: 'delete',
            label: 'Delete',
            click: () => {
              if (this.appService.state.loading) return;
              this.selectionService.remove();
            },
          },
          {
            label: 'Select All',
            accelerator: 'Command+A',
            click: () => {
              if (this.appService.state.loading) return;
              this.selectionService.selectAll();
            },
          },
          { type: 'separator' },
          {
            id: 'nudgeUp',
            label: 'Nudge Selection Up',
            accelerator: 'Up',
            click: () => {
              if (this.appService.state.loading) return;
              this.editorCommandsService.nudgeActiveItemsUp();
            },
          },
          {
            id: 'nudgeDown',
            label: 'Nudge Selection Down',
            accelerator: 'Down',
            click: () => {
              if (this.appService.state.loading) return;
              this.editorCommandsService.nudgeActiveItemsDown();
            },
          },
          {
            id: 'nudgeLeft',
            label: 'Nudge Selection Left',
            accelerator: 'Left',
            click: () => {
              if (this.appService.state.loading) return;
              this.editorCommandsService.nudgeActiveItemsLeft();
            },
          },
          {
            id: 'nudgeRight',
            label: 'Nudge Selection Right',
            accelerator: 'Right',
            click: () => {
              if (this.appService.state.loading) return;
              this.editorCommandsService.nudgeActiveItemsRight();
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
      appMenu.getMenuItemById('nudgeUp').enabled = !!state.selectedIds.length;
      appMenu.getMenuItemById('nudgeDown').enabled = !!state.selectedIds.length;
      appMenu.getMenuItemById('nudgeLeft').enabled = !!state.selectedIds.length;
      appMenu.getMenuItemById('nudgeRight').enabled = !!state.selectedIds.length;
    });
  }
}
