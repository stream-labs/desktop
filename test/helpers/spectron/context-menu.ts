// Helpers for ineracting with context menus

import { TExecutionContext } from '.';

export async function contextMenuClick(t: TExecutionContext, label: string) {
  // There's probably a simpler way to handle this
  await t.context.app.webContents.executeJavaScript(
    `(() => { var _elec = require('electron'); _elec.ipcRenderer.send('__SPECTRON_FAKE_CONTEXT_MENU', '${label}'); })();`,
  );
}
