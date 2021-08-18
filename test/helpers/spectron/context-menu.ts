// Helpers for ineracting with context menus

import { getContext } from './index';

export async function contextMenuClick(label: string) {
  // There's probably a simpler way to handle this
  await getContext().context.app.webContents.executeJavaScript(
    `(() => { var _elec = require('electron'); _elec.ipcRenderer.send('__SPECTRON_FAKE_CONTEXT_MENU', '${label}'); })();`,
  );
}
