import { test, useSpectron } from '../helpers/spectron';
import { sleep } from '../helpers/sleep';
import { setTemporaryRecordingPath } from '../helpers/modules/settings/settings';
import { click, clickButton, select, waitForDisplayed } from '../helpers/modules/core';
import { showPage } from '../helpers/modules/navigation';
import { goLive, stopStream } from '../helpers/modules/streaming';
import { logIn } from '../helpers/modules/user';
import { saveReplayBuffer } from '../helpers/modules/replay-buffer';
import { fillForm } from '../helpers/modules/forms';
const path = require('path');
const fs = require('fs');

useSpectron();

test('Highlighter save and export', async t => {
  await logIn();
  const recordingDir = await setTemporaryRecordingPath();

  await showPage('Highlighter');
  await clickButton('Configure');

  await goLive();
  await sleep(2000);
  await saveReplayBuffer();
  await stopStream();
  await clickButton('Export');
  const fileName = 'MyTestVideo.mp4';
  const exportLocation = path.resolve(recordingDir, fileName);
  await fillForm({ exportLocation });
  const $exportBtn = await (await select('.ant-modal-content')).$('span=Export');
  await click($exportBtn);
  await waitForDisplayed('h2=Upload to YouTube');
  t.true(fs.existsSync(exportLocation), 'The video file should exist');
});
