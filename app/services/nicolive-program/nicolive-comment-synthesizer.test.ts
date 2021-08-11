import { createSetupFunction } from 'util/test-setup';
import { WrappedChat } from './WrappedChat';

type NicoliveCommentSynthesizerService =
  import('./nicolive-comment-synthesizer').NicoliveCommentSynthesizerService;

const setup = createSetupFunction({
  injectee: {
    NicoliveProgramStateService: {
      updated: {
        subscribe() {},
      },
    },
  },
});

jest.mock('services/nicolive-program/state', () => ({ NicoliveProgramStateService: {} }));

beforeEach(() => {
  jest.doMock('services/core/stateful-service');
  jest.doMock('services/core/injector');
});

afterEach(() => {
  jest.resetModules();
});

test('makeSpeech', async () => {
  setup();
  const { NicoliveCommentSynthesizerService } = require('./nicolive-comment-synthesizer');
  const instance = NicoliveCommentSynthesizerService.instance as NicoliveCommentSynthesizerService;

  const testPitch = 0.2;
  const testRate = 0.4;
  const testVolume = 0.6;

  jest.spyOn(instance as any, 'state', 'get').mockReturnValue({
    enabled: true,
    pitch: testPitch,
    rate: testRate,
    volume: testVolume,
  });

  // 辞書変換しない
  jest
    .spyOn(instance.synth, 'makeSpeechText')
    .mockImplementation((chat: WrappedChat) => chat.value.content);

  const makeChat = (s: string): WrappedChat => ({
    type: 'normal',
    value: { content: s },
    seqId: 1,
  });

  // 空文字列を与えるとnullが返ってくる
  expect(instance.makeSpeech(makeChat(''))).toBeNull();

  // stateの設定値を反映している
  expect(instance.makeSpeech(makeChat('test'))).toEqual({
    text: 'test',
    pitch: testPitch,
    rate: testRate,
    volume: testVolume,
  });
});

test('NicoliveCommentSynthesizer', async () => {
  setup();
  const { NicoliveCommentSynthesizer } = require('./nicolive-comment-synthesizer');

  jest.mock('./nicolive-comment-synthesizer', () => ({
    ...jest.requireActual('./nicolive-comment-synthesizer'),
    NicoliveProgramCommentSynthesizerService: {},
  }));

  const synth = new NicoliveCommentSynthesizer();

  jest.spyOn(window, 'speechSynthesis', 'get').mockImplementation(undefined);
  expect(synth.available).toBeFalsy();

  jest
    .spyOn(window, 'speechSynthesis', 'get')
    .mockImplementation(() => true as unknown as SpeechSynthesis);
  expect(synth.available).toBeTruthy();

  expect(synth.makeSpeechText('')).toEqual('');
});
