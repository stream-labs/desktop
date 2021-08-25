import { click, useMainWindow, waitForDisplayed } from './core';

export async function startReplayBuffer() {
  await useMainWindow(async () => {
    await click('button .icon-replay-buffer');
  });
}

export async function saveReplayBuffer() {
  await useMainWindow(async () => {
    await click('button .icon-save');
  });
}

export async function stopReplayBuffer() {
  await useMainWindow(async () => {
    await click('button .fa.fa-stop');
    await waitForDisplayed('button .icon-replay-buffer', { timeout: 15000 });
  });
}
