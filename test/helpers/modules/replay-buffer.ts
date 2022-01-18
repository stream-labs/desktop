import { click, runInMainWindow, waitForDisplayed } from './core';
import {sleep} from "../sleep";

export async function startReplayBuffer() {
  await runInMainWindow(async () => {
    await click('button .icon-replay-buffer');
    await waitForDisplayed('button .fa.fa-stop');
  });
}

export async function saveReplayBuffer() {
  await runInMainWindow(async () => {
    await click('button .icon-save');
    await sleep(5000); // saving takes some time
  });
}

export async function stopReplayBuffer() {
  await runInMainWindow(async () => {
    await click('button .fa.fa-stop');
    await waitForDisplayed('button .icon-replay-buffer', { timeout: 15000 });
  });
}
