import { sleep } from 'util/sleep';
import { Speech } from '../nicolive-comment-synthesizer';
import { NVoiceSynthesizer } from './NVoiceSynthesizer';

type CancelType = 'none' | 'early' | 'playing';
describe('NVoiceSynthesizer', async () => {
  test.each([
    ['test', 1, 'none'],
    ['test', 1, 'early'],
    ['test', 1, 'playing'],
    ['', 0, 'none'],
    // TODO forceのテスト
  ])(`speakText(%s speak:%i cancel:%s)`, async (text: string, numSpeak: number, cancel: CancelType) => {
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

    synth.speakText(speech, onstart, onend, false, onPhoneme);
    expect(synth.speaking).toBeTruthy();
    expect(synth.queueLength).toBe(1);
    expect(synth.playState).toBeNull();

    await sleep(0); // wait for start queue
    expect(synth.speaking).toBeTruthy();
    expect(synth.queueLength).toBe(0);
    expect(synth.playState).toBe('preparing');

    expect(talkMock).toBeCalledTimes(1);
    if (talkMock.mock.calls[0].length > 0) {
      const textArg = talkMock.mock.calls[0][0];
      expect(textArg).toEqual(speech.text);
      const optionsArg = talkMock.mock.calls[0][1];
      expect(optionsArg.speed).toEqual(1 / speech.rate);
      expect(optionsArg.volume).toEqual(speech.volume);
      expect(optionsArg.maxTime).toEqual(speech.nVoice.maxTime);
    }

    switch (cancel) {
      case 'none':
      case 'playing':
        resolvePrepare();
        await sleep(0);
        if (numSpeak > 0) {
          expect(synth.playState).toBe('playing');
          expect(cancelMock).toBeCalledTimes(0);
          expect(onstart).toBeCalledTimes(numSpeak);
          expect(onend).toBeCalledTimes(0);

          if (cancel === 'playing') {
            synth.cancelSpeak();
            expect(cancelMock).toBeCalledTimes(1);
          }

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
        break;

      case 'early':
        synth.cancelSpeak();
        resolvePrepare();
        await sleep(0);
        expect(cancelMock).toBeCalledTimes(1);
        expect(onstart).toBeCalledTimes(1);
        expect(onend).toBeCalledTimes(0);
        resolveSpeaking();
        await sleep(0);
        expect(onend).toBeCalledTimes(1);
        expect(synth.queueLength).toBe(0);
        expect(synth.playState).toBeNull();
        expect(synth.speaking).toBeFalsy();
        break;
    }
  });

});

