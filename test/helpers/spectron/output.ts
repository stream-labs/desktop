import { mkdtemp } from 'fs-extra';
import * as path from 'path';
import { tmpdir } from 'os';
import { focusMain, TExecutionContext } from './index';
import { setFormInput } from './forms';
import { showSettings } from './settings';
import { FormMonkey } from '../form-monkey';

/**
 * Set recording path to a temp dir
 */
export async function setTemporaryRecordingPath(t: TExecutionContext): Promise<string> {
  const tmpDir = await mkdtemp(path.join(tmpdir(), 'slobs-recording-'));
  const { app } = t.context;
  await showSettings(t, 'Output');
  const form = new FormMonkey(t);
  await form.setInputValue(await form.getInputSelectorByTitle('Recording Path'), tmpDir);
  await (await app.client.$('button=Done')).click();
  await focusMain(t);
  return tmpDir;
}

export async function setOutputResolution(t: TExecutionContext, resolution: string) {
  const { app } = t.context;
  const [width, height] = resolution.split('x');
  await showSettings(t, 'Video');
  await (await app.client.$('button=Use Custom')).click();
  const form = new FormMonkey(t);
  await form.fill({ width, height });
  await (await app.client.$('button=Apply')).click;
  await (await app.client.$('button=Done')).click();
  await focusMain(t);
}
