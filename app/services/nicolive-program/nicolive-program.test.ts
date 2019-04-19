import { createSetupFunction } from 'util/test-setup';
import { Subject } from 'rxjs';
import { BehaviorSubject } from '../../../node_modules/rxjs/BehaviorSubject';
type NicoliveProgramService = import('./nicolive-program').NicoliveProgramService;

const schedules = {
  ch: { nicoliveProgramId: 'lv1', socialGroupId: 'ch1', status: 'onAir', onAirBeginAt: 100, onAirEndAt: 150 },
  onAir: { nicoliveProgramId: 'lv1', socialGroupId: 'co1', status: 'onAir', onAirBeginAt: 100, onAirEndAt: 150 },
  test: { nicoliveProgramId: 'lv1', socialGroupId: 'co1', status: 'test', onAirBeginAt: 100, onAirEndAt: 150 },
  end: { nicoliveProgramId: 'lv1', socialGroupId: 'co1', status: 'end', onAirBeginAt: 100, onAirEndAt: 150 },
  reserved1: {
    nicoliveProgramId: 'lv1',
    socialGroupId: 'co1',
    status: 'reserved',
    onAirBeginAt: 150,
    onAirEndAt: 200,
  },
  reserved2: {
    nicoliveProgramId: 'lv1',
    socialGroupId: 'co1',
    status: 'reserved',
    onAirBeginAt: 250,
    onAirEndAt: 300,
  },
};

const programs = {
  onAir: {
    status: schedules.onAir.status,
    title: '番組タイトル',
    description: '番組詳細情報',
    beginAt: schedules.onAir.onAirBeginAt,
    endAt: schedules.onAir.onAirEndAt,
    isMemberOnly: true,
  },
};

const setup = createSetupFunction({
  state: {
    NicoliveProgramService: {
      programID: 'lv1',
    },
  },
  injectee: {
    NicoliveProgramStateService: {
      updated: {
        subscribe() {}
      }
    },
    WindowsService: {
      getWindow() {
        return {
          getMinimumSize: () => [800, 600],
          setMinimumSize: () => {},
          getSize: () => [800, 600],
          setSize: () => {},
          isMaximized: () => false,
        }
      }
    },
    UserService: {
      userLoginState: {
        subscribe() {}
      },
      isLoggedIn: () => true,
    },
  }
});

jest.mock('services/windows', () => ({ WindowsService: {} }));
jest.mock('services/user', () => ({ UserService: {} }));
jest.mock('services/nicolive-program/state', () => ({ NicoliveProgramStateService: {} }));

beforeEach(() => {
  jest.doMock('services/stateful-service');
  jest.doMock('util/injector');
});

afterEach(() => {
  jest.resetModules();
});

test('get instance', () => {
  setup();
  const { NicoliveProgramService } = require('./nicolive-program');
  expect(NicoliveProgramService.instance).toBeInstanceOf(NicoliveProgramService);
});

test('isProgramExtendable', () => {
  setup();
  const { NicoliveProgramService } = require('./nicolive-program');
  const { isProgramExtendable } = NicoliveProgramService;

  expect(isProgramExtendable({ status: 'reserved', startTime: 0, endTime: 5.5 * 60 * 60 })).toBe(false);
  expect(isProgramExtendable({ status: 'test', startTime: 0, endTime: 5.5 * 60 * 60 })).toBe(false);
  expect(isProgramExtendable({ status: 'onAir', startTime: 0, endTime: 5.5 * 60 * 60 })).toBe(true);
  expect(isProgramExtendable({ status: 'end', startTime: 0, endTime: 5.5 * 60 * 60 })).toBe(false);
  expect(isProgramExtendable({ status: 'onAir', startTime: 0, endTime: 6 * 60 * 60 })).toBe(false);
});

test('findSuitableProgram', () => {
  setup();
  const { NicoliveProgramService } = require('./nicolive-program');
  const { findSuitableProgram } = NicoliveProgramService;

  const { ch, reserved1, reserved2, test, onAir, end } = schedules;

  expect(findSuitableProgram([])).toBeNull();
  expect(findSuitableProgram([ch])).toBeNull();
  expect(findSuitableProgram([end])).toBeNull();
  expect(findSuitableProgram([ch, test])).toBe(test);
  expect(findSuitableProgram([ch, onAir])).toBe(onAir);
  expect(findSuitableProgram([ch, reserved1])).toBe(reserved1);
  expect(findSuitableProgram([ch, reserved1, test])).toBe(test);
  expect(findSuitableProgram([ch, reserved1, onAir])).toBe(onAir);
  expect(findSuitableProgram([reserved1, reserved2])).toBe(reserved1);
  expect(findSuitableProgram([reserved2, reserved1])).toBe(reserved1);
  expect(findSuitableProgram([reserved2])).toBe(reserved2);
});

test.each([['CREATED', 1], ['RESERVED', 0], ['OTHER', 0]])(
  'createProgram with %s',
  async (result, fetchProgramCalled) => {
    setup();
    const { NicoliveProgramService } = require('./nicolive-program');
    const instance = NicoliveProgramService.instance as NicoliveProgramService;

    instance.client.createProgram = jest.fn().mockResolvedValue(result);
    instance.fetchProgram = jest.fn();

    await expect(instance.createProgram()).resolves.toBe(result);
    expect(instance.client.createProgram).toHaveBeenCalledTimes(1);
    expect(instance.fetchProgram).toHaveBeenCalledTimes(fetchProgramCalled);
  }
);

test.each([['EDITED', 1], ['OTHER', 0]])('editProgram with %s', async (result, refreshProgramCalled) => {
  setup();
  const m = require('./nicolive-program');
  const instance = m.NicoliveProgramService.instance as NicoliveProgramService;

  instance.client.editProgram = jest.fn().mockResolvedValue(result);
  instance.refreshProgram = jest.fn();

  await expect(instance.editProgram()).resolves.toBe(result);
  expect(instance.client.editProgram).toHaveBeenCalledTimes(1);
  expect(instance.refreshProgram).toHaveBeenCalledTimes(refreshProgramCalled);
});

test('fetchProgramで結果が空ならエラー', async () => {
  setup();
  const { NicoliveProgramService } = require('./nicolive-program');
  const instance = NicoliveProgramService.instance as NicoliveProgramService;

  instance.client.fetchProgramSchedules = jest.fn().mockResolvedValue({ ok: true, value: [] });
  (instance as any).setState = jest.fn();

  await expect(instance.fetchProgram()).rejects.toThrow('no suitable schedule');
  expect(instance.client.fetchProgramSchedules).toHaveBeenCalledTimes(1);
  expect((instance as any).setState).toHaveBeenCalledTimes(1);
  expect((instance as any).setState.mock.calls[0]).toMatchInlineSnapshot(`
Array [
  Object {
    "status": "end",
  },
]
`);
});

test('fetchProgram:成功', async () => {
  setup();
  const { NicoliveProgramService } = require('./nicolive-program');
  const instance = NicoliveProgramService.instance as NicoliveProgramService;

  instance.client.fetchProgramSchedules = jest.fn().mockResolvedValue({ ok: true, value: [schedules.onAir] });
  instance.client.fetchProgram = jest.fn().mockResolvedValue({ ok: true, value: programs.onAir });
  instance.client.fetchCommunity = jest
    .fn()
    .mockResolvedValue({ ok: true, value: { name: 'comunity.name', thumbnailUrl: { small: 'symbol url' } } });

  // TODO: StatefulServiceのモックをVue非依存にする
  (instance as any).setState = jest.fn();

  await expect(instance.fetchProgram()).resolves.toBeUndefined();
  expect(instance.client.fetchProgramSchedules).toHaveBeenCalledTimes(1);
  expect(instance.client.fetchProgram).toHaveBeenCalledTimes(1);
  expect(instance.client.fetchCommunity).toHaveBeenCalledTimes(1);
  expect((instance as any).setState.mock.calls[0]).toMatchInlineSnapshot(`
Array [
  Object {
    "communityID": "co1",
    "communityName": "comunity.name",
    "communitySymbol": "symbol url",
    "description": "番組詳細情報",
    "endTime": 150,
    "isMemberOnly": true,
    "programID": "lv1",
    "startTime": 100,
    "status": "onAir",
    "title": "番組タイトル",
  },
]
`);
});

test('fetchProgramで番組があったが取りに行ったらエラー', async () => {
  setup();
  const { NicoliveProgramService } = require('./nicolive-program');
  const instance = NicoliveProgramService.instance as NicoliveProgramService;
  const value = { meta: { status: 404 } };

  instance.client.fetchProgramSchedules = jest.fn().mockResolvedValue({ ok: true, value: [schedules.onAir] });
  instance.client.fetchProgram = jest.fn().mockResolvedValue({
    ok: false,
    value,
  });
  instance.client.fetchCommunity = jest
    .fn()
    .mockResolvedValue({ ok: true, value: { name: 'comunity.name', thumbnailUrl: { small: 'symbol url' } } });

  (instance as any).setState = jest.fn();

  await expect(instance.fetchProgram()).rejects.toEqual(value);
  expect(instance.client.fetchProgramSchedules).toHaveBeenCalledTimes(1);
  expect(instance.client.fetchProgram).toHaveBeenCalledTimes(1);
  expect(instance.client.fetchCommunity).toHaveBeenCalledTimes(1);
  expect((instance as any).setState).not.toHaveBeenCalled();
});

test('fetchProgramで番組があったがコミュ情報がエラー', async () => {
  setup();
  const { NicoliveProgramService } = require('./nicolive-program');
  const instance = NicoliveProgramService.instance as NicoliveProgramService;
  const value = { meta: { status: 404 } };

  instance.client.fetchProgramSchedules = jest.fn().mockResolvedValue({ ok: true, value: [schedules.onAir] });
  instance.client.fetchProgram = jest.fn().mockResolvedValue({
    ok: true,
    value: {
      status: schedules.onAir.status,
      title: '番組タイトル',
      description: '番組詳細情報',
      beginAt: 100,
      endAt: 150,
    },
  });
  instance.client.fetchCommunity = jest.fn().mockResolvedValue({ ok: false, value });

  (instance as any).setState = jest.fn();

  await expect(instance.fetchProgram()).rejects.toEqual(value);
  expect(instance.client.fetchProgramSchedules).toHaveBeenCalledTimes(1);
  expect(instance.client.fetchProgram).toHaveBeenCalledTimes(1);
  expect(instance.client.fetchCommunity).toHaveBeenCalledTimes(1);
  expect((instance as any).setState).not.toHaveBeenCalled();
});

test('refreshProgram:成功', async () => {
  setup();
  const m = require('./nicolive-program');
  const instance = m.NicoliveProgramService.instance as NicoliveProgramService;

  instance.client.fetchProgram = jest.fn().mockResolvedValue({ ok: true, value: programs.onAir });

  (instance as any).setState = jest.fn();

  await expect(instance.refreshProgram()).resolves.toBeUndefined();
  expect(instance.client.fetchProgram).toHaveBeenCalledTimes(1);
  expect(instance.client.fetchProgram).toHaveBeenCalledWith('lv1');
  expect((instance as any).setState).toHaveBeenCalledTimes(1);
  expect((instance as any).setState.mock.calls[0]).toMatchInlineSnapshot(`
Array [
  Object {
    "description": "番組詳細情報",
    "endTime": 150,
    "isMemberOnly": true,
    "startTime": 100,
    "status": "onAir",
    "title": "番組タイトル",
  },
]
`);
});

test('refreshProgram:失敗', async () => {
  setup();
  const m = require('./nicolive-program');
  const instance = m.NicoliveProgramService.instance as NicoliveProgramService;
  const value = { meta: { status: 500 } };

  instance.client.fetchProgram = jest.fn().mockResolvedValue({ ok: false, value });

  (instance as any).setState = jest.fn();

  await expect(instance.refreshProgram()).rejects.toEqual(value);
  expect(instance.client.fetchProgram).toHaveBeenCalledTimes(1);
  expect(instance.client.fetchProgram).toHaveBeenCalledWith('lv1');
  expect((instance as any).setState).not.toHaveBeenCalled();
});

test('endProgram:成功', async () => {
  setup();
  const m = require('./nicolive-program');
  const instance = m.NicoliveProgramService.instance as NicoliveProgramService;

  instance.client.endProgram = jest.fn().mockResolvedValue({ ok: true, value: { end_time: 125 } });
  (instance as any).setState = jest.fn();

  await expect(instance.endProgram()).resolves.toBeUndefined();
  expect(instance.client.endProgram).toHaveBeenCalledTimes(1);
  expect(instance.client.endProgram).toHaveBeenCalledWith('lv1');
  expect((instance as any).setState).toHaveBeenCalledTimes(1);
  expect((instance as any).setState.mock.calls[0]).toMatchInlineSnapshot(`
Array [
  Object {
    "endTime": 125,
    "status": "end",
  },
]
`);
});

test('endProgram:失敗', async () => {
  setup();
  const m = require('./nicolive-program');
  const instance = m.NicoliveProgramService.instance as NicoliveProgramService;

  const value = { meta: { status: 500 } };
  instance.client.endProgram = jest.fn().mockResolvedValue({ ok: false, value });
  (instance as any).setState = jest.fn();

  await expect(instance.endProgram()).rejects.toEqual(value);
  expect(instance.client.endProgram).toHaveBeenCalledTimes(1);
  expect(instance.client.endProgram).toHaveBeenCalledWith('lv1');
  expect((instance as any).setState).not.toHaveBeenCalled();
});

test('extendProgram:成功', async () => {
  setup();
  const m = require('./nicolive-program');
  const instance = m.NicoliveProgramService.instance as NicoliveProgramService;

  instance.client.extendProgram = jest.fn().mockResolvedValue({ ok: true, value: { end_time: 125 } });
  (instance as any).setState = jest.fn();

  await expect(instance.extendProgram()).resolves.toBeUndefined();
  expect(instance.client.extendProgram).toHaveBeenCalledTimes(1);
  expect(instance.client.extendProgram).toHaveBeenCalledWith('lv1');
  expect((instance as any).setState).toHaveBeenCalledTimes(1);
  expect((instance as any).setState.mock.calls[0]).toMatchInlineSnapshot(`
Array [
  Object {
    "endTime": 125,
  },
]
`);
});

test('extendProgram:失敗', async () => {
  setup();
  const m = require('./nicolive-program');
  const instance = m.NicoliveProgramService.instance as NicoliveProgramService;

  const value = { meta: { status: 500 } };
  instance.client.extendProgram = jest.fn().mockResolvedValue({ ok: false, value });
  (instance as any).setState = jest.fn();

  await expect(instance.extendProgram()).rejects.toEqual(value);
  expect(instance.client.extendProgram).toHaveBeenCalledTimes(1);
  expect(instance.client.extendProgram).toHaveBeenCalledWith('lv1');
  expect((instance as any).setState).not.toHaveBeenCalled();
});

describe('refreshStatisticsPolling', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const suites: {
    name: string;
    prev: any;
    next: any;
    result: 'REFRESH' | 'STOP' | 'NOOP';
  }[] = [
    {
      name: '初期状態から予約状態の番組を開くとタイマーは止まったまま',
      prev: null,
      next: { status: 'reserved', programID: 'lv1' },
      result: 'NOOP',
    },
    {
      name: '初期状態からテスト状態の番組を開くとタイマーは止まったまま',
      prev: null,
      next: { status: 'test', programID: 'lv1' },
      result: 'NOOP',
    },
    {
      name: '初期状態から放送中状態の番組を開くとタイマーを更新する',
      prev: null,
      next: { status: 'onAir', programID: 'lv1' },
      result: 'REFRESH',
    },
    {
      name: '初期状態から終了状態の番組を開くとタイマーは止まったまま',
      prev: null,
      next: { status: 'end', programID: 'lv1' },
      result: 'NOOP',
    },
    {
      name: '予約状態から放送中状態になったらタイマーを更新する',
      prev: { status: 'reserved', programID: 'lv1' },
      next: { status: 'onAir', programID: 'lv1' },
      result: 'REFRESH',
    },
    {
      name: 'テスト状態から放送中状態になったらタイマーを更新する',
      prev: { status: 'test', programID: 'lv1' },
      next: { status: 'onAir', programID: 'lv1' },
      result: 'REFRESH',
    },
    {
      name: 'テスト状態から終了状態になったらタイマーを止める',
      prev: { status: 'onAir', programID: 'lv1' },
      next: { status: 'end', programID: 'lv1' },
      result: 'STOP',
    },
    {
      name: '放送中状態から別番組の予約状態になったらタイマーを止める',
      prev: { status: 'onAir', programID: 'lv1' },
      next: { status: 'reserved', programID: 'lv2' },
      result: 'STOP',
    },
    {
      name: '放送中状態から別番組の放送中状態になったらタイマーを止める',
      prev: { status: 'onAir', programID: 'lv1' },
      next: { status: 'test', programID: 'lv2' },
      result: 'STOP',
    },
    {
      name: '放送中状態から別番組の放送中状態になったらタイマーを更新する',
      prev: { status: 'onAir', programID: 'lv1' },
      next: { status: 'onAir', programID: 'lv2' },
      result: 'REFRESH',
    },
    {
      name: '放送中状態から別番組の終了状態になったらタイマーを止める',
      prev: { status: 'onAir', programID: 'lv1' },
      next: { status: 'end', programID: 'lv2' },
      result: 'STOP',
    },
  ];

  for (const suite of suites) {
    test(suite.name, () => {
      jest.spyOn(window, 'setInterval').mockImplementation(jest.fn());
      jest.spyOn(window, 'clearInterval').mockImplementation(jest.fn());

      setup();
      const { NicoliveProgramService } = require('./nicolive-program');
      const instance = NicoliveProgramService.instance as NicoliveProgramService;
      const state = instance.state;

      instance.updateStatistics = jest.fn();

      instance.refreshStatisticsPolling({...state, ...suite.prev}, {...state, ...suite.next});
      switch (suite.result) {
        case 'REFRESH':
          expect(window.clearInterval).toHaveBeenCalledTimes(1);
          expect(window.clearInterval).toHaveBeenCalledWith(0);
          expect(window.setInterval).toHaveBeenCalledTimes(1);
          expect(window.setInterval).toHaveBeenCalledWith(expect.anything(), 60 * 1000, suite.next.programID);
          break;
        case 'STOP':
          expect(window.clearInterval).toHaveBeenCalledTimes(1);
          expect(window.clearInterval).toHaveBeenCalledWith(0);
          expect(window.setInterval).not.toHaveBeenCalled();
          break;
        case 'NOOP':
          break;
      }
    });
  }
});

test('updateStatistics', async () => {
  setup();
  const { NicoliveProgramService } = require('./nicolive-program');
  const instance = NicoliveProgramService.instance as NicoliveProgramService;

  instance.client.fetchStatistics = jest
    .fn()
    .mockResolvedValue({ ok: true, value: { watchCount: 123, commentCount: 456 } });
  instance.client.fetchNicoadStatistics = jest
    .fn()
    .mockResolvedValue({ ok: true, value: { totalAdPoint: 175, totalGiftPoint: 345 } });

  (instance as any).setState = jest.fn();

  await expect(instance.updateStatistics('lv1')).resolves.toBeInstanceOf(Array);
  expect(instance.client.fetchStatistics).toHaveBeenCalledTimes(1);
  expect(instance.client.fetchStatistics).toHaveBeenCalledWith('lv1');
  expect(instance.client.fetchNicoadStatistics).toHaveBeenCalledTimes(1);
  expect(instance.client.fetchNicoadStatistics).toHaveBeenCalledWith('lv1');
  expect((instance as any).setState).toHaveBeenCalledTimes(2);
  expect((instance as any).setState.mock.calls).toMatchInlineSnapshot(`
Array [
  Array [
    Object {
      "comments": 456,
      "viewers": 123,
    },
  ],
  Array [
    Object {
      "adPoint": 175,
      "giftPoint": 345,
    },
  ],
]
`);
});

test('updateStatistics:APIがエラーでも無視', async () => {
  setup();
  const { NicoliveProgramService } = require('./nicolive-program');
  const instance = NicoliveProgramService.instance as NicoliveProgramService;

  instance.client.fetchStatistics = jest.fn().mockResolvedValue({ ok: false, value: { meta: { status: 500 } } });
  instance.client.fetchNicoadStatistics = jest.fn().mockResolvedValue({ ok: false, value: { meta: { status: 500 } } });

  (instance as any).setState = jest.fn();

  await expect(instance.updateStatistics('lv1')).resolves.toBeInstanceOf(Array);
  expect(instance.client.fetchStatistics).toHaveBeenCalledTimes(1);
  expect(instance.client.fetchStatistics).toHaveBeenCalledWith('lv1');
  expect(instance.client.fetchNicoadStatistics).toHaveBeenCalledTimes(1);
  expect(instance.client.fetchNicoadStatistics).toHaveBeenCalledWith('lv1');
  expect((instance as any).setState).not.toHaveBeenCalled();
});

describe('refreshProgramStatusTimer', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const suites: {
    name: string;
    prev: any;
    next: any;
    result: 'REFRESH' | 'STOP' | 'NOOP';
  }[] = [
    {
      name: '初期状態から予約状態の番組を開くとタイマーを更新する',
      prev: null,
      next: { status: 'reserved', programID: 'lv1', testStartTime: 100, startTime: 200, endTime: 300 },
      result: 'REFRESH',
    },
    {
      name: '初期状態からテスト状態の番組を開くとタイマーを更新する',
      prev: null,
      next: { status: 'test', programID: 'lv1', testStartTime: 100, startTime: 200, endTime: 300 },
      result: 'REFRESH',
    },
    {
      name: '初期状態から放送中状態の番組を開くとタイマーを更新する',
      prev: null,
      next: { status: 'onAir', programID: 'lv1', testStartTime: 100, startTime: 200, endTime: 300 },
      result: 'REFRESH',
    },
    {
      name: '初期状態から終了状態の番組を開くとタイマーは止まったまま',
      prev: null,
      next: { status: 'end', programID: 'lv1', testStartTime: 100, startTime: 200, endTime: 300 },
      result: 'NOOP',
    },
    {
      name: '終了状態から予約状態になったらタイマーを更新する',
      prev: { status: 'end', programID: 'lv0', testStartTime: 10, startTime: 20, endTime: 30 },
      next: { status: 'reserved', programID: 'lv1', testStartTime: 100, startTime: 200, endTime: 300 },
      result: 'REFRESH',
    },
    {
      name: '予約状態から放送中状態になったらタイマーを更新する',
      prev: { status: 'reserved', programID: 'lv1', testStartTime: 100, startTime: 200, endTime: 300 },
      next: { status: 'onAir', programID: 'lv1', testStartTime: 100, startTime: 200, endTime: 300 },
      result: 'REFRESH',
    },
    {
      name: 'テスト状態から放送中状態になったらタイマーを更新する',
      prev: { status: 'test', programID: 'lv1', testStartTime: 100, startTime: 200, endTime: 300 },
      next: { status: 'onAir', programID: 'lv1', testStartTime: 100, startTime: 200, endTime: 300 },
      result: 'REFRESH',
    },
    {
      name: 'テスト状態から終了状態になったらタイマーを止める',
      prev: { status: 'onAir', programID: 'lv1', testStartTime: 100, startTime: 200, endTime: 300 },
      next: { status: 'end', programID: 'lv1', testStartTime: 100, startTime: 200, endTime: 300 },
      result: 'STOP',
    },
    {
      name: '放送中に終了時間が変わったらタイマーを更新する',
      prev: { status: 'onAir', programID: 'lv1', testStartTime: 100, startTime: 200, endTime: 300 },
      next: { status: 'onAir', programID: 'lv1', testStartTime: 100, startTime: 200, endTime: 350 },
      result: 'REFRESH',
    },
    {
      name: '何も変わらなければ何もしない',
      prev: { status: 'onAir', programID: 'lv1', testStartTime: 100, startTime: 200, endTime: 300 },
      next: { status: 'onAir', programID: 'lv1', testStartTime: 100, startTime: 200, endTime: 300 },
      result: 'NOOP',
    },
    // 以下、N Air外部で状態を操作した場合に壊れないことを保証したい
    {
      name: '予約状態から別番組の予約状態になったらタイマーを更新する',
      prev: { status: 'reserved', programID: 'lv1', testStartTime: 100, startTime: 200, endTime: 300 },
      next: { status: 'reserved', programID: 'lv2', testStartTime: 400, startTime: 500, endTime: 600 },
      result: 'REFRESH',
    },
    {
      name: 'テスト状態から別番組のテスト状態になったらタイマーを更新する',
      prev: { status: 'test', programID: 'lv1', testStartTime: 100, startTime: 200, endTime: 300 },
      next: { status: 'test', programID: 'lv2', testStartTime: 400, startTime: 500, endTime: 600 },
      result: 'REFRESH',
    },
    {
      name: '放送中状態から別番組の放送中状態になったらタイマーを更新する',
      prev: { status: 'onAir', programID: 'lv1', testStartTime: 100, startTime: 200, endTime: 300 },
      next: { status: 'onAir', programID: 'lv2', testStartTime: 400, startTime: 500, endTime: 600 },
      result: 'REFRESH',
    },
    {
      name: '終了状態から別番組の終了状態になってもタイマーは止まったまま',
      prev: { status: 'end', programID: 'lv1', testStartTime: 100, startTime: 200, endTime: 300 },
      next: { status: 'end', programID: 'lv2', testStartTime: 400, startTime: 500, endTime: 600 },
      result: 'NOOP',
    },
  ];

  for (const suite of suites) {
    test(suite.name, () => {
      setup();
      const m = require('./nicolive-program');
      const instance = m.NicoliveProgramService.instance as NicoliveProgramService;

      jest.spyOn(window, 'setTimeout').mockImplementation(jest.fn());
      jest.spyOn(window, 'clearTimeout').mockImplementation(jest.fn());
      jest.spyOn(Date, 'now').mockImplementation(jest.fn().mockReturnValue(50));

      instance.updateStatistics = jest.fn();
      const state = instance.state;

      instance.refreshProgramStatusTimer({...state, ...suite.prev}, {...state, ...suite.next});
      switch (suite.result) {
        case 'REFRESH':
          expect(window.clearTimeout).toHaveBeenCalledTimes(1);
          expect(window.clearTimeout).toHaveBeenCalledWith(0);
          expect(window.setTimeout).toHaveBeenCalledTimes(1);
          expect(window.setTimeout).toHaveBeenCalledWith(expect.anything(), expect.anything());
          break;
        case 'STOP':
          expect(window.clearTimeout).toHaveBeenCalledTimes(1);
          expect(window.clearTimeout).toHaveBeenCalledWith(0);
          expect(window.setTimeout).not.toHaveBeenCalled();
          break;
        case 'NOOP':
          break;
      }
    });
  }
});

// TODO: 自動延長系は永続化してから
test.todo('toggleAutoExtension');
test.todo('refreshAutoExtensionTimer');
