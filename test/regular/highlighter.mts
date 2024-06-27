import { test, useWebdriver } from '../helpers/webdriver/index.mjs';
import { setTemporaryRecordingPath } from '../helpers/modules/settings/settings.mjs';
import {
  click,
  clickButton,
  focusMain,
  select,
  waitForDisplayed,
} from '../helpers/modules/core.mjs';
import { showPage } from '../helpers/modules/navigation.mjs';
import {
  prepareToGoLive,
  stopStream,
  tryToGoLive,
  waitForStreamStart,
} from '../helpers/modules/streaming.mjs';
import { logIn } from '../helpers/modules/user.mjs';
import { saveReplayBuffer } from '../helpers/modules/replay-buffer.mjs';
import { fillForm } from '../helpers/modules/forms/index.mjs';
import path from 'path';
import fs from 'fs';

useWebdriver();

test('Highlighter save and export', async t => {
  await logIn();
  const recordingDir = await setTemporaryRecordingPath();

  await showPage('Highlighter');
  await clickButton('Configure');

  await prepareToGoLive();
  await tryToGoLive({
    title: 'SLOBS Test Stream',
    twitchGame: 'Fortnite',
  });
  await waitForStreamStart();
  await saveReplayBuffer();
  await stopStream();

  await focusMain();
  await clickButton('Export');
  const fileName = 'MyTestVideo.mp4';
  const exportLocation = path.resolve(recordingDir, fileName);
  await fillForm({ exportLocation });
  const $exportBtn = await (await select('.ant-modal-content')).$('span=Export');
  await click($exportBtn);
  await waitForDisplayed('h1=Upload To', { timeout: 60000 });
  t.true(fs.existsSync(exportLocation), 'The video file should exist');
});
