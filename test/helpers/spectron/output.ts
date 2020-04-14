import { mkdtemp } from 'fs-extra';
import * as path from 'path';
import { tmpdir } from 'os';
import { focusMain, TExecutionContext } from './index';
import { setFormInput } from './forms';
import { showSettings } from './settings';

/**
 * Set recording path to a temp dir
 */
export async function setTemporaryRecordingPath(t: TExecutionContext): Promise<string> {
  const tmpDir = await mkdtemp(path.join(tmpdir(), `slobs-recording-`));
  const { app } = t.context;
  await showSettings(t, 'Output');
  await setFormInput(t, 'Recording Path', tmpDir);
  await app.client.click('button=Done');
  await focusMain(t);
  return tmpDir;
}

export async function setOutputResolution(t: TExecutionContext, resolution: string) {
  const { app } = t.context;
  await showSettings(t, 'Video');
  await setFormInput(t, 'Output (Scaled) Resolution', resolution);
  await ((app.client.keys(['Enter']) as any) as Promise<any>);
  await app.client.click('button=Done');
  await focusMain(t);
}
