// Helpers for ineracting with context menus

import { getClient } from '../modules/core';

export async function contextMenuClick(label: string) {
  // There's probably a simpler way to handle this
  getClient().execute(
    `(() => { var _elec = require('electron'); _elec.ipcRenderer.send('__SPECTRON_FAKE_CONTEXT_MENU', '${label}'); })();`,
  );
}
