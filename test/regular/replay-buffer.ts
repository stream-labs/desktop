import { readdir } from 'fs-extra';
import { focusChild, focusMain, test, useSpectron } from '../helpers/spectron';
import { sleep } from '../helpers/sleep';
import { setOutputResolution, setTemporaryRecordingPath } from '../helpers/spectron/output';

useSpectron();

test('Replay Buffer', async t => {
  const tmpDir = await setTemporaryRecordingPath(t);
  await setOutputResolution(t, '100x100');
  const { client } = t.context.app;

  await (await client.$('button .icon-replay-buffer')).click();
  await (await client.$('button .icon-save')).click();
  await (await client.$('button .fa.fa-stop')).click();
  await (await client.$('button .icon-replay-buffer')).isDisplayed();

  // Check that the replay-buffer file has been created
  await sleep(3000);
  const files = await readdir(tmpDir);
  t.is(files.length, 1);

  // disable replay buffer
  await (await client.$('.side-nav .icon-settings')).click();
  await focusChild(t);
  await (await client.$('li=Output')).click();
  await (await client.$('label=Enable Replay Buffer')).click();

  // check Start Replay Buffer is not visible
  await focusMain(t);
  t.false(await (await client.$('button .icon-replay-buffer')).isExisting());
});
