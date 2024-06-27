import { click, useMainWindow, waitForDisplayed } from './core.mjs';
import { sleep } from '../sleep.js';

export async function startReplayBuffer() {
  await useMainWindow(async () => {
    await click('button .icon-replay-buffer');
    await waitForDisplayed('button .fa.fa-stop');
  });
}

export async function saveReplayBuffer() {
  await useMainWindow(async () => {
    await click('button .icon-save');
    await sleep(5000); // saving takes some time
  });
}

export async function stopReplayBuffer() {
  await useMainWindow(async () => {
    await click('button .fa.fa-stop');
    await waitForDisplayed('button .icon-replay-buffer', { timeout: 15000 });
  });
}
