import * as path from 'path';
import { tmpdir } from 'os';
import { mkdtemp, readdir } from 'fs-extra';
import { Magic, MAGIC_MIME_TYPE } from 'mmmagic';
import { focusChild, focusMain, test, useSpectron } from './helpers/spectron';
import { setFormDropdown, setFormInput } from './helpers/spectron/forms';
import { sleep } from './helpers/sleep';

useSpectron({ appArgs: '--nosync' });

const magic = new Magic(MAGIC_MIME_TYPE);

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
    await sleep(2000);
  }

  // Check that every file was created
  const files = await readdir(tmpDir);
  // M3U8 creates multiple TS files in addition to the catalog itself.
  t.true(files.length >= formats.length, `Files that were created:\n${files.join('\n')}`);

  await sleep(2000);
  // Perform file detection for every file and ensure they're somewhat-valid videos
  for (const file of files) {
    const info = await detectFile(path.join(tmpDir, file).replace('\\', '\\\\'));
    const mime = info.toString();

    // Unfortunately, TS files don't seem to be detected correctly.
    if (path.extname(file) === '.ts' && mime === 'application/octet-stream') {
      return;
    }

    t.regex(mime, /^video/, `${file} was not detected as a video file`);
  }
});

const detectFile = (file: string) => {
  return new Promise((resolve, reject) => {
    magic.detectFile(file, (err: Error, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};
