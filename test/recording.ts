import * as path from 'path';
import { tmpdir } from 'os';
import { mkdtemp, readdir } from 'fs-extra';
import { focusChild, focusMain, test, useSpectron } from './helpers/spectron';
import { setFormDropdown, setFormInput } from './helpers/spectron/forms';
import { sleep } from './helpers/sleep';

useSpectron({ appArgs: '--nosync' });

test('Recording', async t => {
  const tmpDir = await mkdtemp(path.join(tmpdir(), `slobs-recording-`));
  const { app } = t.context;

  /*
   * Set recording path to a temp dir
   */
  await focusMain(t);
  await app.client.click('.top-nav .icon-settings');

  await focusChild(t);
  await app.client.click('li=Output');

  await setFormInput(t, 'Recording Path', tmpDir);
  await app.client.click('button=Done');

  const formats = ['flv', 'mp4', 'mov', 'mkv', 'ts', 'm3u8'];

  // Record 2s video in every format
  for (const format of formats) {
    await focusMain(t);
    await app.client.click('.top-nav .icon-settings');

    await focusChild(t);
    await app.client.click('li=Output');
    await setFormDropdown(t, 'Recording Format', format);
    await app.client.click('button=Done');
    await focusMain(t);

    // Start recording
    await app.client.click('.record-button');
    await sleep(2000);

    // Ensure recording indicator is active
    await focusMain(t);
    t.true(await app.client.isExisting('.record-button.active'));

    // Stop recording
    await app.client.click('.record-button');
    await sleep(1000);
  }

  // Check that every file was created
  const files = await readdir(tmpDir);

  // M3U8 creates multiple TS files in addition to the catalog itself.
  t.true(files.length >= formats.length, `Files that were created:\n${files.join('\n')}`);
});
