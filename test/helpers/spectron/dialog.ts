import { getClient } from '../modules/core';

export async function dialogDismiss(buttonLabel: string) {
  // There's probably a simpler way to handle this
  await getClient().execute(
    `(() => { var _elec = require('electron'); _elec.ipcRenderer.send('__SPECTRON_FAKE_MESSAGE_BOX', '${buttonLabel}'); })();`,
  );
}
