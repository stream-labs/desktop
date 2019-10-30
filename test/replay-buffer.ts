import * as path from 'path';
import { tmpdir } from 'os';
import { mkdtemp, readdir } from 'fs-extra';
import { focusChild, focusMain, test, useSpectron } from './helpers/spectron';
import { setFormDropdown, setFormInput } from './helpers/spectron/forms';
import { sleep } from './helpers/sleep';
import { setTemporaryRecordingPath } from './helpers/spectron/output';

useSpectron();

test('Replay Buffer', async t => {
  const tmpDir = await setTemporaryRecordingPath(t);
  const { client } = t.context.app;

  await client.click('button .icon-replay-buffer');
  await client.click('button .icon-save');
  await client.click('button .fa.fa-stop');
  await client.isVisible('button .icon-replay-buffer');

  // Check that the replay-buffer file has been created
  await sleep(1000);
  const files = await readdir(tmpDir);
  t.is(files.length, 1);

  // disable replay buffer
  await client.click('.side-nav .icon-settings');
  await focusChild(t);
  await client.click('li=Output');
  await client.click('label=Enable Replay Buffer');

  // check Start Replay Buffer is not visible
  await focusMain(t);
  t.false(await client.isExisting('button .icon-replay-buffer'));
});
