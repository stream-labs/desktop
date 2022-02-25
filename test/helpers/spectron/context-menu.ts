// Helpers for ineracting with context menus

import { getClient } from '../modules/core';

export async function contextMenuClick(label: string | string[]) {
  // There's probably a simpler way to handle this
  await getClient().execute(
    `(() => { var _elec = require('electron'); _elec.ipcRenderer.send('__SPECTRON_FAKE_CONTEXT_MENU', ${JSON.stringify(
      label,
    )}); })();`,
  );
}
