import test from 'ava';
import * as Proxyquire from 'proxyquire';
import * as sinon from 'sinon';
import { merge } from 'lodash';
import { EStreamingState, ERecordingState } from './streaming-api';

import { Response } from 'node-fetch';
(global as any).Response = Response;

const proxyquire = Proxyquire.noCallThru();

function noop() {}

function noopDecorator() {
  return function() {};
}

function identity<T>(x: T): T {
  return x;
}

function createInject(mockServices = {}) {
  return function Inject(serviceName?: string) {
    return function (target: Object, key: string) {
      Object.defineProperty(target, key, {
        get() {
          const name = serviceName || key.charAt(0).toUpperCase() + key.slice(1);
          const serviceInstance = mockServices[name];
          if (!serviceInstance) throw new Error(`no mock defined for "${name}"`);
          return serviceInstance;
        }
      });
    };
  };
}

function getStub({injectees = {}, stubs = {}}) {
  return merge({
    'services/stateful-service': {
      mutation: noopDecorator,
      '@noCallThru': false
    },
    'util/injector': {
      Inject: createInject(merge({
        ObsApiService: {
          nodeObs: {
            OBS_service_connectOutputSignals(callback: any) {},
          },
        }
      }, injectees))
    },
    'services/obs-api': {},
    'services/settings': {},
    'services/windows': {},
    'services/usage-statistics': {},
    'services/i18n': { $t: identity },
    'services/customization': {},
    'services/stream-info': {},
    'services/user': {},
    'electron': {
      default: {
        remote: {
          powerSaveBlocker: {
            // TODO: このあたりをテストに加味する（力尽きた）
            start() {},
            stop() {},
          }
        }
      }
    }
  }, stubs);
}

function getModule(injectees = {}, stubs = {}) {
  return proxyquire('./streaming', getStub({injectees, stubs}));
}

function setupStatefulService(state = {}) {
  require('services/stateful-service')
    .StatefulService
    .setupVuexStore({ watch: identity, state });
}

const createToggleStreamingInjectees = ({
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
    }
  },
  SettingsService: {
    state: {
      General: {
        WarnBeforeStartingStream,
        WarnBeforeStoppingStream,
        RecordWhenStreaming,
        KeepRecordingWhenStreamStops,
      }
    }
  },
  UserService: {
    isNiconicoLoggedIn() { return isNiconicoLoggedIn; },
    updateStreamSettings,
  },
  UsageStatisticsService: {
    recordEvent,
  },
  CustomizationService: {
    optimizeForNiconico,
  }
});

test.beforeEach('confirmをstub化', t => {
  const original = (global as any).confirm;
  const stub = sinon.stub();
  t.context.confirm = {
    original,
    stub,
  };
  (global as any).confirm = stub;
});

test.afterEach.always('confirmをrestore', t => {
  (global as any).confirm = t.context.confirm.original;
});

test('get instance', t => {
  setupStatefulService()
  const m = getModule();
  t.truthy(m.StreamingService.instance, 'インスタンスが取れる');
});

test('toggleStreamingでstreamingStatusがofflineの場合', t => {
  setupStatefulService({
    StreamingService: {
      streamingStatus: EStreamingState.Offline,
      recordingStatus: ERecordingState.Offline,
    }
  });

  const OBS_service_startStreaming = sinon.stub();
  const OBS_service_stopStreaming = sinon.stub();

  const m = getModule(createToggleStreamingInjectees({
    OBS_service_startStreaming,
    OBS_service_stopStreaming,
  }));

  const { instance } = m.StreamingService;
  instance.toggleRecording = sinon.stub();

  instance.toggleStreaming();
  instance.handleOBSOutputSignal({type: 'streaming', signal: 'start'});

  t.true(instance.toggleRecording.notCalled, '録画状態に触っていない');
  t.true(OBS_service_startStreaming.calledOnce, '配信開始を呼んでいる');
  t.true(OBS_service_stopStreaming.notCalled, '配信停止を呼んでいない');
});

test('toggleStreamingでstreamingStatusがoffline、配信開始時に確認して、配信開始をやめる場合', t => {
  setupStatefulService({
    StreamingService: {
      streamingStatus: EStreamingState.Offline,
      recordingStatus: ERecordingState.Offline,
    }
  });

  const OBS_service_startStreaming = sinon.stub();
  const OBS_service_stopStreaming = sinon.stub();

  const m = getModule(createToggleStreamingInjectees({
    OBS_service_startStreaming,
    OBS_service_stopStreaming,
    WarnBeforeStartingStream: true
  }));

  const { instance } = m.StreamingService;

  instance.toggleRecording = sinon.stub();
  t.context.confirm.stub.returns(false);

  instance.toggleStreaming();

  t.true(t.context.confirm.stub.calledOnce, 'モックしたconfirmを呼んでいる');
  t.true(instance.toggleRecording.notCalled, '録画状態に触っていない');
  t.true(OBS_service_startStreaming.notCalled, '配信開始を呼んでいない');
  t.true(OBS_service_stopStreaming.notCalled, '配信停止を呼んでいない');
});

test('toggleStreamingでstreamingStatusがoffline、配信開始時に確認して、配信を始める場合', t => {
  setupStatefulService({
    StreamingService: {
      streamingStatus: EStreamingState.Offline,
      recordingStatus: ERecordingState.Offline,
    }
  });

  const OBS_service_startStreaming = sinon.stub();
  const OBS_service_stopStreaming = sinon.stub();

  const m = getModule(createToggleStreamingInjectees({
    OBS_service_startStreaming,
    OBS_service_stopStreaming,
    WarnBeforeStartingStream: true,
  }));

  const { instance } = m.StreamingService;

  const originalConfirm = (global as any).confirm;
  instance.toggleRecording = sinon.stub();
  t.context.confirm.stub.returns(true);

  instance.toggleStreaming();
  instance.handleOBSOutputSignal({type: 'streaming', signal: 'start'});

  t.true(t.context.confirm.stub.calledOnce, 'モックしたconfirmを呼んでいる');
  t.true(instance.toggleRecording.notCalled, '録画状態に触っていない');
  t.true(OBS_service_startStreaming.calledOnce, '配信開始を呼んでいる');
  t.true(OBS_service_stopStreaming.notCalled, '配信停止を呼んでいない');
});

test('toggleStreamingでstreamingStatusがoffline、配信開始と同時に録画開始する場合', t => {
  setupStatefulService({
    StreamingService: {
      streamingStatus: EStreamingState.Offline,
      recordingStatus: ERecordingState.Offline,
    }
  });

  const OBS_service_startStreaming = sinon.stub();
  const OBS_service_stopStreaming = sinon.stub();
  const OBS_service_connectOutputSignals = sinon.stub();

  const m = getModule(createToggleStreamingInjectees({
    OBS_service_startStreaming,
    OBS_service_stopStreaming,
    OBS_service_connectOutputSignals,
    RecordWhenStreaming: true,
  }));

  const { instance } = m.StreamingService;

  t.is(OBS_service_connectOutputSignals.callCount, 1, '出力状態イベントハンドラを登録している');
  const handler = OBS_service_connectOutputSignals.getCall(0).args[0];

  instance.toggleRecording = sinon.stub();
  instance.toggleStreaming();
  t.true(typeof(handler) === 'function');
  handler({type: 'streaming', signal: 'start'});
  // instance.handleOBSOutputSignal({type: 'streaming', signal: 'start'});

  t.is(instance.toggleRecording.callCount, 1, '録画状態を操作している');
  t.true(OBS_service_startStreaming.calledOnce, '配信開始を呼んでいる');
  t.true(OBS_service_stopStreaming.notCalled, '配信停止を呼んでいない');
});


[EStreamingState.Starting, EStreamingState.Live, EStreamingState.Reconnecting].forEach(streamingStatus => {
  test(`toggleStreamingでstreamingStatusが${streamingStatus}の場合`, t => {
    setupStatefulService({
      StreamingService: {
        streamingStatus,
        recordingStatus: ERecordingState.Offline,
      }
    });

    const OBS_service_startStreaming = sinon.stub();
    const OBS_service_stopStreaming = sinon.stub();

    const m = getModule(createToggleStreamingInjectees({
      OBS_service_startStreaming,
      OBS_service_stopStreaming,
    }));

    const { instance } = m.StreamingService;
    instance.toggleRecording = sinon.stub();

    instance.toggleStreaming();

    t.true(instance.toggleRecording.notCalled, '録画状態に触っていない');
    t.true(OBS_service_startStreaming.notCalled, '配信開始を呼んでいない');
    t.true(OBS_service_stopStreaming.calledOnceWith(false), '配信停止を呼んでいる');
  });

  test(`toggleStreamingでstreamingStatusが${streamingStatus}、配信終了前に確認して、配信終了をやめる場合`, t => {
    setupStatefulService({
      StreamingService: {
        streamingStatus,
        recordingStatus: ERecordingState.Offline,
      }
    });

    const OBS_service_startStreaming = sinon.stub();
    const OBS_service_stopStreaming = sinon.stub();

    const m = getModule(createToggleStreamingInjectees({
      OBS_service_startStreaming,
      OBS_service_stopStreaming,
      WarnBeforeStoppingStream: true
    }));

    const { instance } = m.StreamingService;

    instance.toggleRecording = sinon.stub();
    t.context.confirm.stub.returns(false);

    instance.toggleStreaming();

    t.true(t.context.confirm.stub.calledOnce, 'モックしたconfirmを呼んでいる');
    t.true(instance.toggleRecording.notCalled, '録画状態に触っていない');
    t.true(OBS_service_startStreaming.notCalled, '配信開始を呼んでいない');
    t.true(OBS_service_stopStreaming.notCalled, '配信停止を呼んでいない');
  });

  test(`toggleStreamingでstreamingStatusが${streamingStatus}、配信終了前に確認して、配信終了する場合`, t => {
    setupStatefulService({
      StreamingService: {
        streamingStatus,
        recordingStatus: ERecordingState.Offline,
      }
    });

    const OBS_service_startStreaming = sinon.stub();
    const OBS_service_stopStreaming = sinon.stub();

    const m = getModule(createToggleStreamingInjectees({
      OBS_service_startStreaming,
      OBS_service_stopStreaming,
      WarnBeforeStoppingStream: true,
    }));

    const { instance } = m.StreamingService;

    instance.toggleRecording = sinon.stub();
    t.context.confirm.stub.returns(true);

    instance.toggleStreaming();

    t.true(t.context.confirm.stub.calledOnce, 'モックしたconfirmを呼んでいる');
    t.true(instance.toggleRecording.notCalled, '録画状態に触っていない');
    t.true(OBS_service_startStreaming.notCalled, '配信開始を呼んでいない');
    t.true(OBS_service_stopStreaming.calledOnceWith(false), '配信停止を呼んでいる');
  });

  test(`toggleStreamingでstreamingStatusが${streamingStatus}、配信終了と同時に録画終了する場合`, t => {
    setupStatefulService({
      StreamingService: {
        streamingStatus,
        recordingStatus: ERecordingState.Recording,
      }
    });

    const OBS_service_startStreaming = sinon.stub();
    const OBS_service_stopStreaming = sinon.stub();

    const m = getModule(createToggleStreamingInjectees({
      OBS_service_startStreaming,
      OBS_service_stopStreaming,
      KeepRecordingWhenStreamStops: false,
    }));

    const { instance } = m.StreamingService;

    instance.toggleRecording = sinon.stub();
    instance.toggleStreaming();

    t.true(instance.toggleRecording.calledOnce, '録画状態を操作している');
    t.true(OBS_service_startStreaming.notCalled, '配信開始を呼んでいない');
    t.true(OBS_service_stopStreaming.calledOnceWith(false), '配信停止を呼んでいる');
  });
});

test('toggleStreamingでstreamingStatusがendingの場合', t => {
  setupStatefulService({
    StreamingService: {
      streamingStatus: EStreamingState.Ending,
      recordingStatus: ERecordingState.Offline,
    }
  });

  const OBS_service_startStreaming = sinon.stub();
  const OBS_service_stopStreaming = sinon.stub();

  const m = getModule(createToggleStreamingInjectees({
    OBS_service_startStreaming,
    OBS_service_stopStreaming,
  }));

  const { instance } = m.StreamingService;
  instance.toggleRecording = sinon.stub();

  instance.toggleStreaming();

  t.true(instance.toggleRecording.notCalled, '録画状態に触っていない');
  t.true(OBS_service_startStreaming.notCalled, '配信開始を呼んでいない');
  t.true(OBS_service_stopStreaming.calledOnceWith(true), '配信停止を呼んでいる');
});

test('toggleStreamingAsyncでstreamingStatusがoffline以外の場合', async t => {
  setupStatefulService({
    StreamingService: {
      streamingStatus: EStreamingState.Live
    }
  });

  const m = getModule(createToggleStreamingInjectees());

  const { instance } = m.StreamingService;
  instance.toggleStreaming = sinon.stub();

  await instance.toggleStreamingAsync();

  t.true(instance.toggleStreaming.calledOnce, 'toggleStreamingに移譲する');
});

test('toggleStreamingAsyncでstreamingStatusがoffline、ニコニコにログインしていない場合', async t => {
  setupStatefulService({
    StreamingService: {
      streamingStatus: EStreamingState.Offline
    }
  });

  const m = getModule(createToggleStreamingInjectees());

  const { instance } = m.StreamingService;
  instance.toggleStreaming = sinon.stub();

  await instance.toggleStreamingAsync();

  t.true(instance.toggleStreaming.calledOnce, 'toggleStreamingに移譲する');
});

test('toggleStreamingAsyncでstreamingStatusがoffline、ニコニコにログインしていて、アクションを求めている場合', async t => {
  setupStatefulService({
    StreamingService: {
      streamingStatus: EStreamingState.Offline
    }
  });

  const m = getModule(createToggleStreamingInjectees({
    isNiconicoLoggedIn: true,
    updateStreamSettings() { return { asking: true }; },
  }));

  const { instance } = m.StreamingService;
  instance.toggleStreaming = sinon.stub();

  await instance.toggleStreamingAsync();

  t.true(instance.toggleStreaming.notCalled, 'toggleStreamingを呼ばない');
});

test('toggleStreamingAsyncでstreamingStatusがoffline、ニコニコにログインしていて、番組がなかった場合', async t => {
  setupStatefulService({
    StreamingService: {
      streamingStatus: EStreamingState.Offline
    }
  });

  const m = getModule(createToggleStreamingInjectees({
    isNiconicoLoggedIn: true,
    updateStreamSettings() { return { key: '' }; },
  }), {
    electron: {
      default: {
        remote: {
          dialog: {
            showMessageBox(win: any, obj: any, callback: any) {
              callback();
            }
          },
          getCurrentWindow() {}
        }
      }
    }
  });

  const { instance } = m.StreamingService;
  instance.toggleStreaming = sinon.stub();
  instance.optimizeForNiconico = sinon.stub();

  await instance.toggleStreamingAsync();

  t.true(instance.toggleStreaming.notCalled, 'toggleStreamingを呼ばない');
  t.true(instance.optimizeForNiconico.notCalled, 'optimizeForNiconicoを呼ばない');
});

test('toggleStreamingAsyncでstreamingStatusがoffline、ニコニコにログインしていて、番組が定まり、最適化を行う場合', async t => {
  setupStatefulService({
    StreamingService: {
      streamingStatus: EStreamingState.Offline
    }
  });

  const m = getModule(createToggleStreamingInjectees({
    isNiconicoLoggedIn: true,
    updateStreamSettings() { return { key: 'hoge' }; },
    optimizeForNiconico: true,
  }));

  const { instance } = m.StreamingService;
  instance.optimizeForNiconico = sinon.stub();
  instance.toggleStreaming = sinon.stub();

  await instance.toggleStreamingAsync();

  t.true(instance.optimizeForNiconico.calledOnce, 'optimizeForNiconicoに移譲する');
  t.true(instance.toggleStreaming.notCalled, 'toggleStreamingを呼ばない');
});

test('toggleStreamingAsyncでstreamingStatusがoffline、ニコニコにログインしていて、番組が定まり、最適化を行わない場合', async t => {
  setupStatefulService({
    StreamingService: {
      streamingStatus: EStreamingState.Offline
    }
  });

  const m = getModule(createToggleStreamingInjectees({
    isNiconicoLoggedIn: true,
    updateStreamSettings() { return { key: 'hoge' }; },
  }));

  const { instance } = m.StreamingService;
  instance.toggleStreaming = sinon.stub();
  instance.optimizeForNiconico = sinon.stub();

  await instance.toggleStreamingAsync();

  t.true(instance.optimizeForNiconico.notCalled, 'optimizeForNiconicoを呼ばない');
  t.true(instance.toggleStreaming.calledOnce, 'toggleStreamingに移譲する');
});

test('toggleStreamingAsyncでstreamingStatusがoffline、ニコニコにログインしていて、番組取得にネットワークエラーで失敗した場合', async t => {
  setupStatefulService({
    StreamingService: {
      streamingStatus: EStreamingState.Offline
    }
  });

  const m = getModule(createToggleStreamingInjectees({
    isNiconicoLoggedIn: true,
    updateStreamSettings() { throw new Error('NetworkError'); },
  }), {
    electron: {
      default: {
        remote: {
          dialog: {
            showMessageBox(win: any, obj: any, callback: any) {
              callback();
            }
          },
          getCurrentWindow() {}
        }
      }
    }
  });

  const { instance } = m.StreamingService;
  instance.toggleStreaming = sinon.stub();
  instance.optimizeForNiconico = sinon.stub();

  await instance.toggleStreamingAsync();

  t.true(instance.optimizeForNiconico.notCalled, 'optimizeForNiconicoを呼ばない');
  t.true(instance.toggleStreaming.notCalled, 'toggleStreamingを呼ばない');
});

test('toggleStreamingAsyncでstreamingStatusがoffline、ニコニコにログインしていて、番組取得にHTTPエラーで失敗した場合', async t => {
  setupStatefulService({
    StreamingService: {
      streamingStatus: EStreamingState.Offline
    }
  });

  const m = getModule(createToggleStreamingInjectees({
    isNiconicoLoggedIn: true,
    updateStreamSettings() {
      throw new Response('HTTPError', {
        statusText: 'Internal Server Error(stub)',
        status: 500
      });
    },
  }), {
    electron: {
      default: {
        remote: {
          dialog: {
            showMessageBox(win: any, obj: any, callback: any) {
              callback();
            }
          },
          getCurrentWindow() {}
        }
      }
    }
  });

  const { instance } = m.StreamingService;
  instance.toggleStreaming = sinon.stub();
  instance.optimizeForNiconico = sinon.stub();

  await instance.toggleStreamingAsync();

  t.true(instance.optimizeForNiconico.notCalled, 'optimizeForNiconicoを呼ばない');
  t.true(instance.toggleStreaming.notCalled, 'toggleStreamingを呼ばない');
});

