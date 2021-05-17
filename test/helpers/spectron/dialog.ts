import { TExecutionContext } from '.';

export async function dialogDismiss(t: TExecutionContext, buttonLabel: string) {
  // There's probably a simpler way to handle this
  await t.context.app.webContents.executeJavaScript(
    `(() => { var _elec = require('electron'); _elec.ipcRenderer.send('__SPECTRON_FAKE_MESSAGE_BOX', '${buttonLabel}'); })();`,
  );
}
