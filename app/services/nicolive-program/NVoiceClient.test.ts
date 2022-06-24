import { existsSync, unlinkSync } from "fs";
import { getNVoicePath } from "n-voice-package";
import { join } from "path";
import { NVoiceClient } from "./NVoiceClient";

test('NVoiceClient', async () => {
  const dir = getNVoicePath();
  const client = new NVoiceClient({ baseDir: dir });
  const filename = join(dir, 'test.wav');
  try {
    await client._startNVoice();
    await client.talk(1.0, 'テスト', filename);
    expect(existsSync(filename)).toBeTruthy();
  } finally {
    if (existsSync(filename)) {
      unlinkSync(filename);
    }
  }
});
