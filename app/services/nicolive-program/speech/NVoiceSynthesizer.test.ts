import { sleep } from 'util/sleep';
import { Speech } from '../nicolive-comment-synthesizer';
import { INVoiceTalker, NVoiceSynthesizer } from './NVoiceSynthesizer';

describe('NVoiceSynthesizer', async () => {
  test.each([
    ['test', false, 1, 0],
    // ['test', true, 1, 1],
    ['', false, 0, 0],
    // ['', true, 0, 0],
  ])(`speakText(%s force:%s speak:%i cancel:%i)`, async (text: string, force: boolean, numSpeak: number, numCancel: number) => {
    const cancelMock = jest.fn(async () => { });
    let resolvePrepare: () => void;
    const preparePromise = new Promise<void>((resolve) => { resolvePrepare = resolve });
    let resolveSpeaking: () => void;
    const speakingPromise = new Promise<void>((resolve) => { resolveSpeaking = resolve });
    const talkMock = jest.fn(async (text, options) => {
      await preparePromise;
      if (text) {
        return {
          cancel: cancelMock,
          speaking: speakingPromise,
        };
      } else {
        return null;
      }
    });
    const synth = new NVoiceSynthesizer({ talk: talkMock });
    const onstart = jest.fn();
    const onend = jest.fn();
    const onPhoneme = jest.fn();
    const speech: Speech = {
      synthesizer: 'nVoice',
      text,
      nVoice: {
        maxTime: 4,
      },
      rate: 0.5,
      volume: 0.5,
    };
    expect(synth.speaking).toBeFalsy();

    synth.speakText(speech, onstart, onend, force, onPhoneme);
    expect(synth.speaking).toBeTruthy();
    expect(synth.queueLength).toBe(1);
    expect(synth.playState).toBeNull();

    await sleep(0); // wait for start queue
    expect(synth.speaking).toBeTruthy();
    expect(synth.queueLength).toBe(0);
    expect(synth.playState).toBe('preparing');

    resolvePrepare();
    await sleep(0);
    if (numSpeak > 0) {
      expect(synth.playState).toBe('playing');

      expect(talkMock).toBeCalledTimes(1);
      if (talkMock.mock.calls[0].length > 0) {
        const textArg = talkMock.mock.calls[0][0];
        expect(textArg).toEqual(speech.text);
      }
      expect(cancelMock).toBeCalledTimes(numCancel);
      expect(onstart).toBeCalledTimes(numSpeak);

      expect(onend).toBeCalledTimes(0);
      resolveSpeaking();
      await sleep(0);
      expect(onend).toBeCalledTimes(1);
      expect(synth.queueLength).toBe(0);
      expect(synth.playState).toBeNull();
      expect(synth.speaking).toBeFalsy();
    } else {
      expect(synth.queueLength).toBe(0);
      expect(synth.playState).toBeNull();
      expect(synth.speaking).toBeFalsy();
    }
  });

});

