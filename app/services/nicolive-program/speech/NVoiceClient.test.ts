import { getNVoicePath } from '@n-air-app/n-voice-package';
import { join } from 'path';
import { NVoiceClient } from './NVoiceClient';

describe('NVoiceClient', () => {
  const dir = getNVoicePath();
  const client = new NVoiceClient({
    baseDir: dir,
    onError: (err: Error) => {
      console.error(err);
    },
  });
  const filename = join(dir, 'test.wav');

  test('empty', async () => {
    expect((await client.talk(1.0, '', filename)).wave).toBeNull();
  });

  test('"テスト"', async () => {
    const { wave, labels } = await client.talk(1.0, 'テスト', filename);
    expect(wave).not.toBeNull();
    expect(labels.map(l => l.phoneme)).toEqual(['silB', 't', 'e', 's', 'U', 't', 'o', 'silE']);
  }, 10000 /* longer timeout */);
});
