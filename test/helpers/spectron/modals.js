import { sleep } from '../sleep';

export async function dismissModal(t) {
  await t.context.app.client.leftClick('.v--modal-background-click', 1, 1);

  // Wait for dismiss animation to play
  await sleep(500);
}
