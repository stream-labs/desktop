import * as electron from 'electron';
import { EStreamingState, ERecordingState } from './streaming-api';

import * as fetchMock from 'fetch-mock';
import { createSetupFunction } from 'util/test-setup';

jest.mock('services/stateful-service');
jest.mock('util/injector');
jest.mock('services/obs-api', () => ({}));
jest.mock('services/settings', () => ({}));
jest.mock('services/windows', () => ({}));
jest.mock('services/usage-statistics', () => ({}));
jest.mock('services/i18n', () => ({
  $t: (x: any) => x,
}));
jest.mock('services/customization', () => ({}));
jest.mock('services/stream-info', () => ({}));
jest.mock('services/user', () => ({}));

function noop() {}

const createInjectee = ({
  OBS_service_startStreaming = noop,
  OBS_service_stopStreaming = noop,
  OBS_service_connectOutputSignals = noop,
  recordEvent = noop,
  WarnBeforeStartingStream = false,
  WarnBeforeStoppingStream = false,
  RecordWhenStreaming = false,
  KeepRecordingWhenStreamStops = true,
  isNiconicoLoggedIn = false,
  updateStreamSettings = noop,
  optimizeForNiconico = false,
} = {}) => ({
  ObsApiService: {
    nodeObs: {
      OBS_service_startStreaming,
      OBS_service_stopStreaming,
      OBS_service_connectOutputSignals,
    },
  },
  SettingsService: {
    state: {
      General: {
        WarnBeforeStartingStream,
        WarnBeforeStoppingStream,
        RecordWhenStreaming,
        KeepRecordingWhenStreamStops,
      },
    },
  },
  UserService: {
    isNiconicoLoggedIn() {
      return isNiconicoLoggedIn;
    },
    updateStreamSettings,
  },
  UsageStatisticsService: {
    recordEvent,
  },
  CustomizationService: {
    optimizeForNiconico,
  },
});

const setup = createSetupFunction({
  injectee: createInjectee(),
});

beforeEach(() => {
  /**
   * jest.spyOnをリセット
   * @see https://jestjs.io/docs/ja/jest-object#jestrestoreallmocks
   **/
  jest.restoreAllMocks();

  jest.resetModules();
});

test('get instance', () => {
  setup();
  const { StreamingService } = require('./streaming');
  expect(StreamingService.instance).toBeInstanceOf(StreamingService);
});

test('toggleStreamingでstreamingStatusがofflineの場合', () => {
  const OBS_service_startStreaming = jest.fn();
  const OBS_service_stopStreaming = jest.fn();

  setup({
    injectee: createInjectee({
      OBS_service_startStreaming,
      OBS_service_stopStreaming,
    }),
    state: {
      StreamingService: {
        streamingStatus: EStreamingState.Offline,
        recordingStatus: ERecordingState.Offline,
      },
    },
  });

  const { StreamingService } = require('./streaming');
  const { instance } = StreamingService;

  instance.toggleRecording = jest.fn();
  instance.toggleStreaming();
  instance.handleOBSOutputSignal({ type: 'streaming', signal: 'start' });

  expect(instance.toggleRecording).not.toHaveBeenCalled();
  expect(OBS_service_startStreaming).toHaveBeenCalledTimes(1);
  expect(OBS_service_stopStreaming).not.toHaveBeenCalled();
});

test('toggleStreamingでstreamingStatusがoffline、配信開始時に確認して、配信開始をやめる場合', () => {
  const OBS_service_startStreaming = jest.fn();
  const OBS_service_stopStreaming = jest.fn();

  setup({
    injectee: createInjectee({
      OBS_service_startStreaming,
      OBS_service_stopStreaming,
      WarnBeforeStartingStream: true,
    }),
    state: {
      StreamingService: {
        streamingStatus: EStreamingState.Offline,
        recordingStatus: ERecordingState.Offline,
      },
    },
  });

  const { StreamingService } = require('./streaming');
  const { instance } = StreamingService;

  instance.toggleRecording = jest.fn();
  jest.spyOn(window, 'confirm').mockReturnValue(false);
  instance.toggleStreaming();

  expect(window.confirm).toHaveBeenCalledTimes(1);
  expect(instance.toggleRecording).not.toHaveBeenCalled();
  expect(OBS_service_startStreaming).not.toHaveBeenCalled();
  expect(OBS_service_stopStreaming).not.toHaveBeenCalled();
});

test('toggleStreamingでstreamingStatusがoffline、配信開始時に確認して、配信を始める場合', () => {
  const OBS_service_startStreaming = jest.fn();
  const OBS_service_stopStreaming = jest.fn();

  setup({
    injectee: createInjectee({
      OBS_service_startStreaming,
      OBS_service_stopStreaming,
      WarnBeforeStartingStream: true,
    }),
    state: {
      StreamingService: {
        streamingStatus: EStreamingState.Offline,
        recordingStatus: ERecordingState.Offline,
      },
    },
  });

  const { StreamingService } = require('./streaming');
  const { instance } = StreamingService;

  instance.toggleRecording = jest.fn();
  jest.spyOn(window, 'confirm').mockReturnValue(true);
  instance.toggleStreaming();
  instance.handleOBSOutputSignal({ type: 'streaming', signal: 'start' });

  expect(window.confirm).toHaveBeenCalledTimes(1);
  expect(instance.toggleRecording).not.toHaveBeenCalled();
  expect(OBS_service_startStreaming).toHaveBeenCalledTimes(1);
  expect(OBS_service_stopStreaming).not.toHaveBeenCalled();
});

test('toggleStreamingでstreamingStatusがoffline、配信開始と同時に録画開始する場合', () => {
  const OBS_service_startStreaming = jest.fn();
  const OBS_service_stopStreaming = jest.fn();
  const OBS_service_connectOutputSignals = jest.fn();

  setup({
    injectee: createInjectee({
      OBS_service_startStreaming,
      OBS_service_stopStreaming,
      OBS_service_connectOutputSignals,
      RecordWhenStreaming: true,
    }),
    state: {
      StreamingService: {
        streamingStatus: EStreamingState.Offline,
        recordingStatus: ERecordingState.Offline,
      },
    },
  });

  const { StreamingService } = require('./streaming');
  const { instance } = StreamingService;

  expect(OBS_service_connectOutputSignals).toHaveBeenCalledTimes(1);
  const handler = OBS_service_connectOutputSignals.mock.calls[0][0];

  instance.toggleRecording = jest.fn();
  instance.toggleStreaming();
  expect(typeof handler).toBe('function');
  handler({ type: 'streaming', signal: 'start' });

  expect(instance.toggleRecording).toHaveBeenCalledTimes(1);
  expect(OBS_service_startStreaming).toHaveBeenCalledTimes(1);
  expect(OBS_service_stopStreaming).not.toHaveBeenCalled();
});

[EStreamingState.Starting, EStreamingState.Live, EStreamingState.Reconnecting].forEach(streamingStatus => {
  test(`toggleStreamingでstreamingStatusが${streamingStatus}の場合`, () => {
    const OBS_service_startStreaming = jest.fn();
    const OBS_service_stopStreaming = jest.fn();

    setup({
      injectee: createInjectee({
        OBS_service_startStreaming,
        OBS_service_stopStreaming,
      }),
      state: {
        StreamingService: {
          streamingStatus,
          recordingStatus: ERecordingState.Offline,
        },
      },
    });

    const { StreamingService } = require('./streaming');
    const { instance } = StreamingService;

    instance.toggleRecording = jest.fn();
    instance.toggleStreaming();

    expect(instance.toggleRecording).not.toHaveBeenCalled();
    expect(OBS_service_startStreaming).not.toHaveBeenCalled();
    expect(OBS_service_stopStreaming).toHaveBeenCalledTimes(1);
    expect(OBS_service_stopStreaming).toHaveBeenCalledWith(false);
  });

  test(`toggleStreamingでstreamingStatusが${streamingStatus}、配信終了前に確認して、配信終了をやめる場合`, () => {
    const OBS_service_startStreaming = jest.fn();
    const OBS_service_stopStreaming = jest.fn();

    setup({
      injectee: createInjectee({
        OBS_service_startStreaming,
        OBS_service_stopStreaming,
        WarnBeforeStoppingStream: true,
      }),
      state: {
        StreamingService: {
          streamingStatus,
          recordingStatus: ERecordingState.Offline,
        },
      },
    });

    const { StreamingService } = require('./streaming');
    const { instance } = StreamingService;

    instance.toggleRecording = jest.fn();
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    instance.toggleStreaming();

    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(instance.toggleRecording).not.toHaveBeenCalled();
    expect(OBS_service_startStreaming).not.toHaveBeenCalled();
    expect(OBS_service_stopStreaming).not.toHaveBeenCalled();
  });

  test(`toggleStreamingでstreamingStatusが${streamingStatus}、配信終了前に確認して、配信終了する場合`, () => {
    const OBS_service_startStreaming = jest.fn();
    const OBS_service_stopStreaming = jest.fn();

    setup({
      injectee: createInjectee({
        OBS_service_startStreaming,
        OBS_service_stopStreaming,
        WarnBeforeStoppingStream: true,
      }),
      state: {
        StreamingService: {
          streamingStatus,
          recordingStatus: ERecordingState.Offline,
        },
      },
    });

    const { StreamingService } = require('./streaming');
    const { instance } = StreamingService;

    instance.toggleRecording = jest.fn();
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    instance.toggleStreaming();

    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(instance.toggleRecording).not.toHaveBeenCalled();
    expect(OBS_service_startStreaming).not.toHaveBeenCalled();
    expect(OBS_service_stopStreaming).toHaveBeenCalledTimes(1);
    expect(OBS_service_stopStreaming).toHaveBeenCalledWith(false);
  });

  test(`toggleStreamingでstreamingStatusが${streamingStatus}、配信終了と同時に録画終了する場合`, () => {
    const OBS_service_startStreaming = jest.fn();
    const OBS_service_stopStreaming = jest.fn();

    setup({
      injectee: createInjectee({
        OBS_service_startStreaming,
        OBS_service_stopStreaming,
        KeepRecordingWhenStreamStops: false,
      }),
      state: {
        StreamingService: {
          streamingStatus,
          recordingStatus: ERecordingState.Recording,
        },
      },
    });

    const { StreamingService } = require('./streaming');
    const { instance } = StreamingService;

    instance.toggleRecording = jest.fn();
    instance.toggleStreaming();

    expect(instance.toggleRecording).toHaveBeenCalledTimes(1);
    expect(OBS_service_startStreaming).not.toHaveBeenCalled();
    expect(OBS_service_stopStreaming).toHaveBeenCalledTimes(1);
    expect(OBS_service_stopStreaming).toHaveBeenCalledWith(false);
  });
});

test('toggleStreamingでstreamingStatusがendingの場合', () => {
  const OBS_service_startStreaming = jest.fn();
  const OBS_service_stopStreaming = jest.fn();

  setup({
    injectee: createInjectee({
      OBS_service_startStreaming,
      OBS_service_stopStreaming,
      KeepRecordingWhenStreamStops: false,
    }),
    state: {
      StreamingService: {
        streamingStatus: EStreamingState.Ending,
        recordingStatus: ERecordingState.Offline,
      },
    },
  });

  const { StreamingService } = require('./streaming');
  const { instance } = StreamingService;

  instance.toggleRecording = jest.fn();

  instance.toggleStreaming();

  expect(instance.toggleRecording).not.toHaveBeenCalled();
  expect(OBS_service_startStreaming).not.toHaveBeenCalled();
  expect(OBS_service_stopStreaming).toHaveBeenCalledTimes(1);
  expect(OBS_service_stopStreaming).toHaveBeenCalledWith(true);
});

test('toggleStreamingAsyncでstreamingStatusがoffline以外の場合', async () => {
  setup({
    state: {
      StreamingService: {
        streamingStatus: EStreamingState.Live,
      },
    },
  });

  const { StreamingService } = require('./streaming');
  const { instance } = StreamingService;

  instance.toggleStreaming = jest.fn();

  await instance.toggleStreamingAsync();

  expect(instance.toggleStreaming).toHaveBeenCalledTimes(1);
});

test('toggleStreamingAsyncでstreamingStatusがoffline、ニコニコにログインしていない場合', async () => {
  setup({
    state: {
      StreamingService: {
        streamingStatus: EStreamingState.Offline,
      },
    },
  });

  const { StreamingService } = require('./streaming');
  const { instance } = StreamingService;

  instance.toggleStreaming = jest.fn();

  await instance.toggleStreamingAsync();

  expect(instance.toggleStreaming).toHaveBeenCalledTimes(1);
});

test('toggleStreamingAsyncでstreamingStatusがoffline、ニコニコにログインしていて、アクションを求めている場合', async () => {
  setup({
    injectee: createInjectee({
      isNiconicoLoggedIn: true,
      updateStreamSettings() {
        return { asking: true };
      },
    }),
    state: {
      StreamingService: {
        streamingStatus: EStreamingState.Offline,
      },
    },
  });

  const { StreamingService } = require('./streaming');
  const { instance } = StreamingService;

  instance.toggleStreaming = jest.fn();

  await instance.toggleStreamingAsync();

  expect(instance.toggleStreaming).not.toHaveBeenCalled();
});

test('toggleStreamingAsyncでstreamingStatusがoffline、ニコニコにログインしていて、番組がなかった場合', async () => {
  setup({
    injectee: createInjectee({
      isNiconicoLoggedIn: true,
      updateStreamSettings() {
        return { key: '' };
      },
    }),
    state: {
      StreamingService: {
        streamingStatus: EStreamingState.Offline,
      },
    },
  });

  const { StreamingService } = require('./streaming');
  const { instance } = StreamingService;

  instance.toggleStreaming = jest.fn();
  instance.optimizeForNiconico = jest.fn();

  jest
    .spyOn(electron.remote.dialog, 'showMessageBox')
    .mockImplementation(function showMessageBox(win: any, options: any, callback: any) {
      callback();
    } as any);

  await instance.toggleStreamingAsync();

  expect(instance.toggleStreaming).not.toHaveBeenCalled();
  expect(instance.optimizeForNiconico).not.toHaveBeenCalled();
});

test('toggleStreamingAsyncでstreamingStatusがoffline、ニコニコにログインしていて、番組が定まり、最適化を行う場合', async () => {
  setup({
    injectee: createInjectee({
      isNiconicoLoggedIn: true,
      updateStreamSettings() {
        return { key: 'hoge' };
      },
      optimizeForNiconico: true,
    }),
    state: {
      StreamingService: {
        streamingStatus: EStreamingState.Offline,
      },
    },
  });

  const { StreamingService } = require('./streaming');
  const { instance } = StreamingService;
  instance.optimizeForNiconico = jest.fn();
  instance.toggleStreaming = jest.fn();

  await instance.toggleStreamingAsync();

  expect(instance.optimizeForNiconico).toHaveBeenCalledTimes(1);
  expect(instance.toggleStreaming).not.toHaveBeenCalled();
});

test('toggleStreamingAsyncでstreamingStatusがoffline、ニコニコにログインしていて、番組が定まり、最適化を行わない場合', async () => {
  setup({
    injectee: createInjectee({
      isNiconicoLoggedIn: true,
      updateStreamSettings() {
        return { key: 'hoge' };
      },
    }),
    state: {
      StreamingService: {
        streamingStatus: EStreamingState.Offline,
      },
    },
  });

  const { StreamingService } = require('./streaming');
  const { instance } = StreamingService;
  instance.toggleStreaming = jest.fn();
  instance.optimizeForNiconico = jest.fn();

  await instance.toggleStreamingAsync();

  expect(instance.optimizeForNiconico).not.toHaveBeenCalled();
  expect(instance.toggleStreaming).toHaveBeenCalledTimes(1);
});

test('toggleStreamingAsyncでstreamingStatusがoffline、ニコニコにログインしていて、番組取得にネットワークエラーで失敗した場合', async () => {
  setup({
    injectee: createInjectee({
      isNiconicoLoggedIn: true,
      updateStreamSettings() {
        throw new Error('NetworkError');
      },
    }),
    state: {
      StreamingService: {
        streamingStatus: EStreamingState.Offline,
      },
    },
  });

  jest
    .spyOn(electron.remote.dialog, 'showMessageBox')
    .mockImplementation(function showMessageBox(win: any, options: any, callback: any) {
      callback();
    } as any);

  const { StreamingService } = require('./streaming');
  const { instance } = StreamingService;
  instance.toggleStreaming = jest.fn();
  instance.optimizeForNiconico = jest.fn();

  await instance.toggleStreamingAsync();

  expect(instance.optimizeForNiconico).not.toHaveBeenCalled();
  expect(instance.toggleStreaming).not.toHaveBeenCalled();
});

test('toggleStreamingAsyncでstreamingStatusがoffline、ニコニコにログインしていて、番組取得にHTTPエラーで失敗した場合', async () => {
  setup({
    injectee: createInjectee({
      isNiconicoLoggedIn: true,
      updateStreamSettings() {
        throw new Response('HTTPError', {
          statusText: 'Internal Server Error(stub)',
          status: 500,
        });
      },
    }),
    state: {
      StreamingService: {
        streamingStatus: EStreamingState.Offline,
      },
    },
  });

  jest
    .spyOn(electron.remote.dialog, 'showMessageBox')
    .mockImplementation(function showMessageBox(win: any, options: any, callback: any) {
      callback();
    } as any);

  const { StreamingService } = require('./streaming');
  const { instance } = StreamingService;
  instance.toggleStreaming = jest.fn();
  instance.optimizeForNiconico = jest.fn();

  await instance.toggleStreamingAsync();

  expect(instance.optimizeForNiconico).not.toHaveBeenCalled();
  expect(instance.toggleStreaming).not.toHaveBeenCalled();
});
