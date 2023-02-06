import { Speech } from '../nicolive-comment-synthesizer';
import { WebSpeechSynthesizer } from './WebSpeechSynthesizer';

describe('WebSpeechSynthesizer', () => {
  test('available', async () => {
    const synth = new WebSpeechSynthesizer();

    jest.spyOn(window, 'speechSynthesis', 'get').mockImplementation(undefined);
    expect(synth.available).toBeFalsy();

    jest
      .spyOn(window, 'speechSynthesis', 'get')
      .mockImplementation(() => true as unknown as SpeechSynthesis);
    expect(synth.available).toBeTruthy();
  });

  test.each([
    ['test', false, 1, 0],
    ['test', true, 1, 1],
    ['', false, 0, 0],
    ['', true, 0, 0],
  ])(`speakText(%s force:%s speak:%i cancel:%i)`, async (text: string, force: boolean, numSpeak: number, numCancel: number) => {
    const speakMock = jest.fn();
    const cancelMock = jest.fn();
    jest.spyOn(window, 'speechSynthesis', 'get').mockImplementation(() => ({
      speak: speakMock,
      cancel: cancelMock,
    }) as unknown as SpeechSynthesis);

    const synth = new WebSpeechSynthesizer();
    const onstart = jest.fn();
    const onend = jest.fn();
    const speech: Speech = {
      synthesizer: 'webSpeech',
      text,
      webSpeech: {
        pitch: 0.5,
      },
      rate: 0.5,
      volume: 0.5,
    };
    synth.speakText(speech, onstart, onend, force);

    expect(cancelMock).toBeCalledTimes(numCancel);
    expect(speakMock).toBeCalledTimes(numSpeak);

    if (numSpeak > 0) {
      const utterance = speakMock.mock.calls[0][0] as SpeechSynthesisUtterance;
      expect(utterance.text).toEqual(speech.text);
      expect(utterance.pitch).toEqual(speech.webSpeech.pitch);
      expect(utterance.rate).toEqual(speech.rate);
      expect(utterance.volume).toEqual(speech.volume);

      expect(onstart).toBeCalledTimes(0);
      utterance.onstart({} as SpeechSynthesisEvent);
      expect(onstart).toBeCalledTimes(1);

      expect(onend).toBeCalledTimes(0);
      utterance.onend({} as SpeechSynthesisEvent);
      expect(onend).toBeCalledTimes(1);
    }
  });

});
