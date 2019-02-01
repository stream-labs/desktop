import { Menu } from './Menu';
import { $t } from 'services/i18n';
import { remote } from 'electron';

export function setupGlobalContextMenuForEditableElement() {
  const win = remote.getCurrentWindow();
  win.webContents.on('context-menu', function contextMenuEventHandler(event, params) {
    if (!params.isEditable) return;

    const hasText = params.selectionText.trim().length > 0;
    const menu = new Menu();
    menu.append({
      label: 'Undo',
      accelerator: 'Ctrl+Z',
      role: 'undo',
      enabled: params.editFlags.canUndo,
      visible: params.isEditable,
    });
    menu.append({
      label: 'Redo',
      accelerator: 'Ctrl+Y',
      role: 'redo',
      enabled: params.editFlags.canRedo,
      visible: params.isEditable,
    });
    menu.append({ type: 'separator' });
    menu.append({
      label: 'Cut',
      accelerator: 'Ctrl+X',
      role: 'cut',
      enabled: hasText && params.editFlags.canCut,
      visible: params.isEditable,
    });
    menu.append({
      label: 'Copy',
      accelerator: 'Ctrl+C',
      role: 'copy',
      enabled: hasText && params.editFlags.canCopy,
      visible: params.isEditable,
    });
    menu.append({
      label: 'Paste',
      accelerator: 'Ctrl+V',
      role: 'paste',
      enabled: params.editFlags.canPaste,
      visible: params.isEditable,
    });
    menu.append({ type: 'separator' });
    menu.append({
      label: 'Select All',
      accelerator: 'Ctrl+A',
      role: 'selectall',
      enabled: params.editFlags.canSelectAll,
      visible: params.isEditable,
    });
    menu.popup();
  });
}
