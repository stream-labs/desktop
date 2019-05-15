import { mkdtemp } from 'fs-extra';
import * as path from 'path';
import { tmpdir } from 'os';
import { focusChild, focusMain, TExecutionContext } from './index';
import { setFormInput } from './forms';
import { sleep } from '../sleep';

/**
 * Set recording path to a temp dir
 */
export async function setTemporaryRecordingPath(t: TExecutionContext): Promise<string> {
  const tmpDir = await mkdtemp(path.join(tmpdir(), `slobs-recording-`));
  const { app } = t.context;

  await focusMain(t);
  await app.client.click('.top-nav .icon-settings');

  await focusChild(t);
  await app.client.click('li=Output');

  await setFormInput(t, 'Recording Path', tmpDir);
  await app.client.click('button=Done');

  await focusMain(t);
  return tmpDir;
}

export async function setOutputResolution(t: TExecutionContext, resolution: string) {
  const { app } = t.context;

  await focusMain(t);
  await app.client.click('.top-nav .icon-settings');

  await focusChild(t);
  await app.client.click('li=Video');

  await setFormInput(t, 'Output (Scaled) Resolution', resolution);
  await ((app.client.keys(['Enter']) as any) as Promise<any>);

  await app.client.click('button=Done');

  await focusMain(t);
}
