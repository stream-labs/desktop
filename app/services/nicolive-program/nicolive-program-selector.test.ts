import { createSetupFunction } from 'util/test-setup';
import { Subject } from 'rxjs';
import { NicoliveProgramSelectorService, TStep, TProviderType } from './nicolive-program-selector';

const setup = createSetupFunction({
  injectee: {
    NicoliveProgramSelectorService: {
      stateChange: new Subject(),
    },
  },
});

beforeEach(() => {
  jest.doMock('services/stateful-service');
  jest.doMock('util/injector');
});

afterEach(() => {
  jest.resetModules();
});

test('ユーザー番組を選んで配信開始のための番組情報を準備できる', () => {
  setup();
  const { NicoliveProgramSelectorService } = require('./nicolive-program-selector');
  const instance = NicoliveProgramSelectorService.instance as NicoliveProgramSelectorService;
  expect(instance.state.currentStep).toBe('providerTypeSelect');

  // 確認へ
  const programId = 'lv1111';
  instance.onSelectProviderTypeUser();
  expect(instance.state.currentStep).toBe('confirm');
  expect(instance.state.selectedProviderType).toBe('user');
  expect(instance.state.selectedChannel).toBeNull();
  expect(instance.state.selectedProgram).toMatchObject({ id: programId });
});

test('チャンネル番組を選んで配信開始のための番組情報を準備できる', () => {
  setup();
  const { NicoliveProgramSelectorService } = require('./nicolive-program-selector');
  const instance = NicoliveProgramSelectorService.instance as NicoliveProgramSelectorService;
  expect(instance.state.currentStep).toBe('providerTypeSelect');

  // チャンネル選択へ
  instance.onSelectProviderTypeChannel();
  expect(instance.state.currentStep).toBe('channelSelect');
  expect(instance.state.selectedProviderType).toBe('channel');

  // 番組選択へ
  const selectedChannelId = 'ch9999';
  const selectedChannelName = 'チャンネルああああ'
  const programs = [{ id: 'lv1111' }, { id: 'lv2222' }];
  instance.onSelectChannel(selectedChannelId, selectedChannelName);
  expect(instance.state.currentStep).toBe('programSelect');
  // TODO: APIを叩くようになったら、モック化されたAPIを絡めたテストを書く
  // その際タイトルも検査するようにする
  expect(instance.state.selectedChannel).toMatchObject({ id: selectedChannelId, name: selectedChannelName })
  expect(instance.state.candidatePrograms[0].id).toBe(programs[0].id);
  expect(instance.state.candidatePrograms[1].id).toBe(programs[1].id);

  // 確認へ
  const selectedProgramId = 'lv1111';
  const selectedProgramTitle = '番組いいいい';
  instance.onSelectBroadcastingProgram(selectedProgramId, selectedProgramTitle);
  expect(instance.state.currentStep).toBe('confirm');
  expect(instance.state.selectedProviderType).toBe('channel');
  expect(instance.state.selectedChannel).toMatchObject({ id: selectedChannelId, name: selectedChannelName });
  expect(instance.state.selectedProgram).toMatchObject({ id: selectedProgramId, title: selectedProgramTitle });
});

test('番組選択ステップで, チャンネルや番組の選択をしようとしても何も起きない.', () => {
  setup();
  const { NicoliveProgramSelectorService } = require('./nicolive-program-selector');
  const instance = NicoliveProgramSelectorService.instance as NicoliveProgramSelectorService;
  expect(instance.state.currentStep).toBe('providerTypeSelect');

  // チャンネル選択ができない
  instance.onSelectChannel('ch1', 'name');
  expect(instance.state.currentStep).toBe('providerTypeSelect');
  expect(instance.state.selectedChannel).toBeNull();

  // 番組選択ができない
  instance.onSelectBroadcastingProgram('lv1', 'title')
  expect(instance.state.currentStep).toBe('providerTypeSelect');
  expect(instance.state.selectedProgram).toBeNull();
});

test('チャンネル選択ステップで, 配信種別や番組の選択をしようとしても何も起きない. ', () => {
  setup();
  const { NicoliveProgramSelectorService } = require('./nicolive-program-selector');
  const instance = NicoliveProgramSelectorService.instance as NicoliveProgramSelectorService;
  expect(instance.state.currentStep).toBe('providerTypeSelect');

  // チャンネル選択へ
  instance.onSelectProviderTypeChannel();
  expect(instance.state.currentStep).toBe('channelSelect');
  expect(instance.state.selectedProviderType).toBe('channel');

  // 配信種別をチャンネルに変更しようとしても何も起きない
  instance.onSelectProviderTypeChannel();
  expect(instance.state.currentStep).toBe('channelSelect');
  expect(instance.state.selectedProviderType).toBe('channel');

  // 配信種別をユーザー番組に変更できない
  instance.onSelectProviderTypeUser();
  expect(instance.state.currentStep).toBe('channelSelect');
  expect(instance.state.selectedProviderType).toBe('channel');

  // 番組を選択できない
  instance.onSelectBroadcastingProgram('lv1', 'title')
  expect(instance.state.currentStep).toBe('channelSelect');
  expect(instance.state.selectedProgram).toBeNull();
});

test('番組選択ステップで, 配信種別やチャンネルの選択をしようとしても何も起きない.', () => {
  setup();
  const { NicoliveProgramSelectorService } = require('./nicolive-program-selector');
  const instance = NicoliveProgramSelectorService.instance as NicoliveProgramSelectorService;
  expect(instance.state.currentStep).toBe('providerTypeSelect');

  // チャンネル選択へ
  instance.onSelectProviderTypeChannel();

  // 番組選択へ
  const selectedChannelId = 'ch9999';
  instance.onSelectChannel(selectedChannelId, 'チャンネルああああ');
  expect(instance.state.currentStep).toBe('programSelect');

  // 配信種別をチャンネルに変更しようとしても何も起きない
  instance.onSelectProviderTypeChannel();
  expect(instance.state.currentStep).toBe('programSelect');
  expect(instance.state.selectedProviderType).toBe('channel');

  // 配信種別をユーザー番組に変更できない
  instance.onSelectProviderTypeUser();
  expect(instance.state.currentStep).toBe('programSelect');
  expect(instance.state.selectedProviderType).toBe('channel');

  // チャンネルを選択しようとしても何も起きない
  instance.onSelectChannel('ch100000000', 'name')
  expect(instance.state.currentStep).toBe('programSelect');
  expect(instance.state.selectedChannel.id).toBe(selectedChannelId)
});

test('ユーザー番組の確認ステップでは, あらゆる設定済の項目を変更することはできない.', () => {
  setup();
  const { NicoliveProgramSelectorService } = require('./nicolive-program-selector');
  const instance = NicoliveProgramSelectorService.instance as NicoliveProgramSelectorService;
  expect(instance.state.currentStep).toBe('providerTypeSelect');

  // 確認へ
  instance.onSelectProviderTypeUser();
  expect(instance.state.currentStep).toBe('confirm');

  // 配信種別をチャンネルに変更できない
  instance.onSelectProviderTypeChannel();
  expect(instance.state.currentStep).toBe('confirm');
  expect(instance.state.selectedProviderType).toBe('user');

  // 配信種別をユーザーに変更しようとしても何も起きない
  instance.onSelectProviderTypeChannel();
  expect(instance.state.currentStep).toBe('confirm');
  expect(instance.state.selectedProviderType).toBe('user');

  // チャンネルを選択しようとしても何も起きない
  instance.onSelectChannel('ch1111', 'name')
  expect(instance.state.currentStep).toBe('confirm');
  expect(instance.state.selectedProviderType).toBe('user');
  expect(instance.state.selectedChannel).toBeNull();

  // 番組を選択しようとしても変更できない
  instance.onSelectBroadcastingProgram('lv1111', 'title')
  expect(instance.state.currentStep).toBe('confirm');
  expect(instance.state.selectedProviderType).toBe('user');
  expect(instance.state.selectedProgram.id).toBe('lv9800');
});

test('チャンネル番組の確認ステップでは, あらゆる設定済の項目を変更することはできない', () => {
  setup();
  const { NicoliveProgramSelectorService } = require('./nicolive-program-selector');
  const instance = NicoliveProgramSelectorService.instance as NicoliveProgramSelectorService;
  expect(instance.state.currentStep).toBe('providerTypeSelect');
  // チャンネル選択へ
  instance.onSelectProviderTypeChannel();

  // 番組選択へ
  const selectedChannelId = 'ch9999';
  instance.onSelectChannel(selectedChannelId, 'チャンネルああああ');

  // 確認へ
  const selectedProgram = 'lv1111';
  instance.onSelectBroadcastingProgram(selectedProgram, 'タイトル');
  expect(instance.state.currentStep).toBe('confirm');

  // 配信種別をチャンネルに変更しようとしても何も起きない
  instance.onSelectProviderTypeChannel();
  expect(instance.state.currentStep).toBe('confirm');
  expect(instance.state.selectedProviderType).toBe('channel');

  // 配信種別をユーザーに変更できない
  instance.onSelectProviderTypeChannel();
  expect(instance.state.currentStep).toBe('confirm');
  expect(instance.state.selectedProviderType).toBe('channel');

  // チャンネルを選択しようとしても変更できない
  instance.onSelectChannel('ch1111', 'name')
  expect(instance.state.currentStep).toBe('confirm');
  expect(instance.state.selectedProviderType).toBe('channel');
  expect(instance.state.selectedChannel.id).toBe(selectedChannelId);

  // 番組を選択しようとしても変更できない
  instance.onSelectBroadcastingProgram('lv2222', 'title')
  expect(instance.state.currentStep).toBe('confirm');
  console.log(instance.state.currentStep);
  expect(instance.state.selectedProviderType).toBe('channel');
  expect(instance.state.selectedProgram.id).toBe(selectedProgram);
});

describe('ステップ比較系メソッド', () => {
  // 指定ステップの状態のインスタンスを作るユーティリティ
  function createServiceInstanceByStep(step: TStep, providerType: TProviderType) {
    setup();
    const { NicoliveProgramSelectorService } = require('./nicolive-program-selector');
    const instance = NicoliveProgramSelectorService.instance as NicoliveProgramSelectorService;
    if (providerType === 'user') {
      switch (step) {
        case 'providerTypeSelect':
          return instance;
        case 'confirm':
          instance.onSelectProviderTypeUser();
          return instance;
        default:
          throw new Error('作れません')
      }
    } else {
      switch (step) {
        case 'providerTypeSelect':
          return instance;
        case 'channelSelect':
          instance.onSelectProviderTypeChannel();
          return instance;
        case 'programSelect':
          instance.onSelectProviderTypeChannel();
          instance.onSelectChannel('ch9999', 'name');
          return instance;
        case 'confirm':
          instance.onSelectProviderTypeChannel();
          instance.onSelectChannel('ch9999', 'name');
          instance.onSelectBroadcastingProgram('id', 'title');
          return instance;
      }
    }
  }
  describe('isCompletedOrCurrentStep', () => {
    test('providerTypeSelect ステップのインスタンスに対して正しい値を返す', () => {
      // 初期状態なので, 'user' でも同様.
      const instance = createServiceInstanceByStep('providerTypeSelect', 'channel');
      expect(instance.isCompletedOrCurrentStep('providerTypeSelect')).toBe(true);
      expect(instance.isCompletedOrCurrentStep('channelSelect')).toBe(false);
      expect(instance.isCompletedOrCurrentStep('programSelect')).toBe(false);
      expect(instance.isCompletedOrCurrentStep('confirm')).toBe(false);
    });
    test('channelSelect ステップのインスタンスに対して正しい値を返す', () => {
      const instance = createServiceInstanceByStep('channelSelect', 'channel');
      expect(instance.isCompletedOrCurrentStep('providerTypeSelect')).toBe(true);
      expect(instance.isCompletedOrCurrentStep('channelSelect')).toBe(true);
      expect(instance.isCompletedOrCurrentStep('programSelect')).toBe(false);
      expect(instance.isCompletedOrCurrentStep('confirm')).toBe(false);
    });
    test('programSelect ステップのインスタンスに対して正しい値を返す', () => {
      const instance = createServiceInstanceByStep('programSelect', 'channel');
      expect(instance.isCompletedOrCurrentStep('providerTypeSelect')).toBe(true);
      expect(instance.isCompletedOrCurrentStep('channelSelect')).toBe(true);
      expect(instance.isCompletedOrCurrentStep('programSelect')).toBe(true);
      expect(instance.isCompletedOrCurrentStep('confirm')).toBe(false);
    });
    test('confirm ステップ (チャンネル番組) のインスタンスに対して正しい値を返す', () => {
      const instance = createServiceInstanceByStep('confirm', 'channel');
      expect(instance.isCompletedOrCurrentStep('providerTypeSelect')).toBe(true);
      expect(instance.isCompletedOrCurrentStep('channelSelect')).toBe(true);
      expect(instance.isCompletedOrCurrentStep('programSelect')).toBe(true);
      expect(instance.isCompletedOrCurrentStep('confirm')).toBe(true);
    });
    test('confirm ステップ (ユーザー番組) のインスタンスに対して正しい値を返す', () => {
      const instance = createServiceInstanceByStep('confirm', 'user');
      expect(instance.isCompletedOrCurrentStep('providerTypeSelect')).toBe(true);
      expect(instance.isCompletedOrCurrentStep('channelSelect')).toBe(false); // ユーザー番組は経由しない
      expect(instance.isCompletedOrCurrentStep('programSelect')).toBe(false); // ユーザー番組は経由しない
    });
  });
  describe('isCompletedStep', () => {
    test('providerTypeSelect ステップのインスタンスに対して正しい値を返す', () => {
      // 初期状態なので, 'user' でも同様.
      const instance = createServiceInstanceByStep('providerTypeSelect', 'channel');
      expect(instance.isCompletedStep('providerTypeSelect')).toBe(false);
      expect(instance.isCompletedStep('channelSelect')).toBe(false);
      expect(instance.isCompletedStep('programSelect')).toBe(false);
      expect(instance.isCompletedStep('confirm')).toBe(false);
    });
    test('channelSelect ステップのインスタンスに対して正しい値を返す', () => {
      const instance = createServiceInstanceByStep('channelSelect', 'channel');
      expect(instance.isCompletedStep('providerTypeSelect')).toBe(true);
      expect(instance.isCompletedStep('channelSelect')).toBe(false);
      expect(instance.isCompletedStep('programSelect')).toBe(false);
      expect(instance.isCompletedStep('confirm')).toBe(false);
    });
    test('programSelect ステップのインスタンスに対して正しい値を返す', () => {
      const instance = createServiceInstanceByStep('programSelect', 'channel');
      expect(instance.isCompletedStep('providerTypeSelect')).toBe(true);
      expect(instance.isCompletedStep('channelSelect')).toBe(true);
      expect(instance.isCompletedStep('programSelect')).toBe(false);
      expect(instance.isCompletedStep('confirm')).toBe(false);
    });
    test('confirm ステップ (チャンネル番組) のインスタンスに対して正しい値を返す', () => {
      const instance = createServiceInstanceByStep('confirm', 'channel');
      expect(instance.isCompletedStep('providerTypeSelect')).toBe(true);
      expect(instance.isCompletedStep('channelSelect')).toBe(true);
      expect(instance.isCompletedStep('programSelect')).toBe(true);
      expect(instance.isCompletedStep('confirm')).toBe(false);
    });
    test('confirm ステップ (ユーザー番組) のインスタンスに対して正しい値を返す', () => {
      const instance = createServiceInstanceByStep('confirm', 'user');
      expect(instance.isCompletedStep('providerTypeSelect')).toBe(true);
      expect(instance.isCompletedStep('channelSelect')).toBe(false); // ユーザー番組は経由しない
      expect(instance.isCompletedStep('programSelect')).toBe(false); // ユーザー番組は経由しない
      expect(instance.isCompletedStep('confirm')).toBe(false);
    });
  });
  describe('backTo', () => {
    describe('providerTypeSelect ステップのインスタンスに対して呼び出しても何も起こらない', () => {
      test('どの状態に戻ろうとしても何も起こらない', () => {
        const instance = createServiceInstanceByStep('providerTypeSelect', 'channel');
        (instance as any).SET_STATE = jest.fn();
        instance.backTo('providerTypeSelect');
        instance.backTo('channelSelect');
        instance.backTo('programSelect');
        instance.backTo('confirm');
        expect((instance as any).SET_STATE).not.toBeCalled();
      })
    });
    describe('broadcastChanelSelect ステップのインスタンスに対して状態をクリアできる', () => {
      test('providerTypeSelect ステップに戻るときに適切な状態に初期化できる', () => {
        const instance = createServiceInstanceByStep('channelSelect', 'channel');
        instance.backTo('providerTypeSelect');
        expect(instance.state).toMatchObject({
          currentStep: 'providerTypeSelect',
          candidatePrograms: [],
          selectedProviderType: null,
          selectedChannel: null,
          selectedProgram: null
        });
      });
      test('その他のステップに戻ろうとしても何も起こらない', () => {
        const instance = createServiceInstanceByStep('channelSelect', 'channel');
        (instance as any).SET_STATE = jest.fn();
        instance.backTo('channelSelect');
        instance.backTo('programSelect');
        instance.backTo('confirm');
        expect((instance as any).SET_STATE).not.toBeCalled();
      })
    });
    describe('programSelect ステップのインスタンスに対して状態をクリアできる', () => {
      test('providerTypeSelect ステップに戻るときに適切な状態に初期化できる', () => {
        const instance = createServiceInstanceByStep('programSelect', 'channel');
        instance.backTo('providerTypeSelect');
        expect(instance!.state).toMatchObject({
          currentStep: 'providerTypeSelect',
          candidatePrograms: [],
          selectedProviderType: null,
          selectedChannel: null,
          selectedProgram: null
        });
      });
      test('channelSelect ステップに戻るときに適切な状態に初期化できる', () => {
        const instance = createServiceInstanceByStep('programSelect', 'channel');
        instance.backTo('channelSelect');
        expect(instance.state).toMatchObject({
          currentStep: 'channelSelect',
          candidatePrograms: [],
          selectedProviderType: 'channel',
          selectedChannel: null,
          selectedProgram: null
        });
      });
      test('その他のステップに戻ろうとしても何も起こらない', () => {
        const instance = createServiceInstanceByStep('programSelect', 'channel');
        (instance as any).SET_STATE = jest.fn();
        instance.backTo('programSelect');
        instance.backTo('confirm');
        expect((instance as any).SET_STATE).not.toBeCalled();
      });
    });
    describe('confirm ステップ (チャンネル番組) のインスタンスに対して状態をクリアできる', () => {
      test('providerTypeSelect ステップに戻るときに適切な状態に初期化できる', () => {
        const instance = createServiceInstanceByStep('confirm', 'channel');
        instance.backTo('providerTypeSelect');
        expect(instance.state).toMatchObject({
          currentStep: 'providerTypeSelect',
          candidatePrograms: [],
          selectedProviderType: null,
          selectedChannel: null,
          selectedProgram: null
        });
      });
      test('channelSelect ステップに戻るときに適切な状態に初期化できる', () => {
        const instance = createServiceInstanceByStep('confirm', 'channel');
        instance.backTo('channelSelect');
        expect(instance.state).toMatchObject({
          currentStep: 'channelSelect',
          candidatePrograms: [],
          selectedProviderType: 'channel',
          selectedChannel: null,
          selectedProgram: null
        });
      });
      test('programSelect ステップに戻るときに適切な状態に初期化できる', () => {
        const instance = createServiceInstanceByStep('confirm', 'channel');
        instance.backTo('programSelect');
        expect(instance.state).toMatchObject({
          currentStep: 'programSelect',
          candidatePrograms: [
            // TODO: 番組情報取得APIを叩くようになったらそのAPIのモックの値に変更する必要がある
            { id: 'lv1', title: 'これは lv1 のタイトルです' },
            { id: 'lv2', title: 'これは lv2 のタイトルです' },
            { id: 'lv3', title: 'これは lv3 のタイトルです' }
          ],
          selectedProviderType: 'channel',
          selectedChannel: { id: 'ch9999', name: 'name' },
          selectedProgram: null
        });
      });
      test('confirm ステップに戻ろうとしても何も起こらない', () => {
        const instance = createServiceInstanceByStep('confirm', 'channel');
        (instance as any).SET_STATE = jest.fn();
        instance.backTo('confirm');
        expect((instance as any).SET_STATE).not.toBeCalled();
      });
    });
    describe('confirm ステップ (ユーザー番組) のインスタンスに対して状態をクリアできる', () => {
      test('providerTypeSelect ステップに戻るときに適切な状態に初期化できる', () => {
        const instance = createServiceInstanceByStep('confirm', 'user');
        instance.backTo('providerTypeSelect');
        expect(instance.state).toMatchObject({
          currentStep: 'providerTypeSelect',
          candidatePrograms: [],
          selectedProviderType: null,
          selectedChannel: null,
          selectedProgram: null
        });
      });
      test('他のステップに戻ろうとしても何も起こらない', () => {
        const instance = createServiceInstanceByStep('confirm', 'user');
        (instance as any).SET_STATE = jest.fn();
        instance.backTo('channelSelect'); // ユーザー番組ではスキップされるため無効
        instance.backTo('programSelect');  // ユーザー番組ではスキップされるため無効
        instance.backTo('confirm');
        expect((instance as any).SET_STATE).not.toBeCalled();
      });
    });
  })
})

