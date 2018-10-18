export async function dialogDismiss(t, buttonLabel) {
  await t.context.app.electron.ipcRenderer.send(
    '__SPECTRON_FAKE_MESSAGE_BOX',
    buttonLabel
  );
}
