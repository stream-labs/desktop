// Helpers for ineracting with context menus

export async function contextMenuClick(t, id) {
  await t.context.app.electron.ipcRenderer.send(
    '__SPECTRON_FAKE_CONTEXT_MENU',
    id
  );
}
