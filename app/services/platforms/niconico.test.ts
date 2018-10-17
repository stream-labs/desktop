import test from 'ava';
import * as Proxyquire from 'proxyquire';
import * as sinon from 'sinon';
import { sleep } from 'util/sleep';

const proxyquire = Proxyquire.noCallThru();

function noopDecorator() {
  return function() {};
}

function createInject(mockServices: any) {
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

function identity<T>(x: T): T {
  return x;
}

const getStub = (injectTable = {}) => ({
  './../stateful-service': {
    mutation: noopDecorator,
    '@noCallThru': false
  },
  '../../util/injector': {
    Inject: createInject({
      StreamingService: {
        streamingStatusChange: {
          subscribe() {}
        }
      },
      ...injectTable
    })
  },
  '../../util/sleep': {
    sleep: () => sleep(0),
  },
  '../streaming': {
    StreamingService: {}
  },
  '../user': {
    UserService: {}
  },
  '../settings': {
    SettingsService: {}
  },
  'services/windows': {
    WindowsService: {}
  },
});

test('get instance', t => {
  require('../stateful-service')
    .StatefulService
    .setupVuexStore({ watch: identity });

  const m = proxyquire('./niconico', getStub());
  t.truthy(m.NiconicoService.instance);
});

test('setupStreamSettingsで番組がない場合', async t => {
  require('../stateful-service')
    .StatefulService
    .setupVuexStore({ watch: identity });

  const m = proxyquire('./niconico', getStub());
  const { instance } = m.NiconicoService;
  const spy = sinon.spy(() => Promise.resolve({}));
  instance.fetchLiveProgramInfo = spy;

  const result = await instance.setupStreamSettings()
  t.falsy(result.url, '空の配信設定を得る');
  t.false(result.asking, 'ポップアップは出さない');
  t.true(spy.calledTwice, 'リトライするので2回呼ぶ')
});

test('setupStreamSettingsで番組がひとつある場合', async t => {
  require('../stateful-service')
    .StatefulService
    .setupVuexStore({ watch: identity });

  const updatePlatformChannelIdStub = sinon.stub();
  const getSettingsFormDataStub = sinon.stub();
  const setSettingsStub = sinon.stub();

  getSettingsFormDataStub.returns([
    {
      nameSubCategory: 'Untitled',
      parameters: [
        { name: 'service', value: '' },
        { name: 'server', value: '' },
        { name: 'key', value: '' }
      ]
    }
  ]);

  const injectMap = {
    UserService: {
      updatePlatformChannelId: updatePlatformChannelIdStub
    },
    SettingsService: {
      getSettingsFormData: getSettingsFormDataStub,
      setSettings: setSettingsStub
    }
  };

  const m = proxyquire('./niconico', getStub(injectMap));

  const { instance } = m.NiconicoService;

  const fetchLiveProgramInfoStub = sinon.stub();
  instance.fetchLiveProgramInfo = fetchLiveProgramInfoStub;
  fetchLiveProgramInfoStub.returns(Promise.resolve({
    channelId: {
      url: 'url1',
      key: 'key1',
      bitrate: 'bitrate1',
    }
  }));

  const result = await instance.setupStreamSettings();
  t.is(result.url, 'url1', '配信設定を受け取れる');
  t.true(updatePlatformChannelIdStub.calledOnceWith('channelId'), 'チャンネルIDをUsersServiceに通知する');
  t.true(setSettingsStub.args[0][0] === 'Stream', '配信設定を更新する');

  const wroteSettings = setSettingsStub.args[0][1];
  const params = wroteSettings[0].parameters;
  t.is(params.find((x: any) => x.name === 'service').value, 'niconico ニコニコ生放送');
  t.is(params.find((x: any) => x.name === 'server').value, 'url1');
  t.is(params.find((x: any) => x.name === 'key').value, 'key1');
});

test('setupStreamSettingsで番組取得にリトライで成功する場合', async t => {
  require('../stateful-service')
    .StatefulService
    .setupVuexStore({ watch: identity });

  const updatePlatformChannelIdStub = sinon.stub();
  const getSettingsFormDataStub = sinon.stub();
  const setSettingsStub = sinon.stub();

  getSettingsFormDataStub.returns([
    {
      nameSubCategory: 'Untitled',
      parameters: [
        { name: 'service', value: '' },
        { name: 'server', value: '' },
        { name: 'key', value: '' }
      ]
    }
  ]);

  const injectMap = {
    UserService: {
      updatePlatformChannelId: updatePlatformChannelIdStub
    },
    SettingsService: {
      getSettingsFormData: getSettingsFormDataStub,
      setSettings: setSettingsStub
    }
  };

  const m = proxyquire('./niconico', getStub(injectMap));

  const { instance } = m.NiconicoService;

  const fetchLiveProgramInfoStub = sinon.stub();
  instance.fetchLiveProgramInfo = fetchLiveProgramInfoStub;
  fetchLiveProgramInfoStub.onCall(0).returns(Promise.resolve({}));
  fetchLiveProgramInfoStub.returns(Promise.resolve({
    channelId: {
      url: 'url1',
      key: 'key1',
      bitrate: 'bitrate1',
    }
  }));

  const result = await instance.setupStreamSettings();
  t.is(result.url, 'url1', '配信設定を受け取れる');
  t.true(updatePlatformChannelIdStub.calledOnceWith('channelId'), 'チャンネルIDをUsersServiceに通知する');
  t.true(setSettingsStub.args[0][0] === 'Stream', '配信設定を更新する');

  const wroteSettings = setSettingsStub.args[0][1];
  const params = wroteSettings[0].parameters;
  t.is(params.find((x: any) => x.name === 'service').value, 'niconico ニコニコ生放送');
  t.is(params.find((x: any) => x.name === 'server').value, 'url1');
  t.is(params.find((x: any) => x.name === 'key').value, 'key1');
});

test('setupStreamSettingsで番組が複数ある場合', async t => {
  require('../stateful-service')
    .StatefulService
    .setupVuexStore({ watch: identity });

  const updatePlatformChannelIdStub = sinon.stub();
  const getSettingsFormDataStub = sinon.stub();
  const setSettingsStub = sinon.stub();
  const showWindowStub = sinon.stub();

  getSettingsFormDataStub.returns([
    {
      nameSubCategory: 'Untitled',
      parameters: [
        { name: 'service', value: '' },
        { name: 'server', value: '' },
        { name: 'key', value: '' }
      ]
    }
  ]);

  const injectMap = {
    UserService: {
      updatePlatformChannelId: updatePlatformChannelIdStub
    },
    SettingsService: {
      getSettingsFormData: getSettingsFormDataStub,
      setSettings: setSettingsStub
    },
    WindowsService: {
      showWindow: showWindowStub
    }
  };

  const m = proxyquire('./niconico', getStub(injectMap));

  const { instance } = m.NiconicoService;

  const fetchLiveProgramInfoStub = sinon.stub();
  instance.fetchLiveProgramInfo = fetchLiveProgramInfoStub;
  const info = {
    channelId1: {
      url: 'url1',
      key: 'key1',
      bitrate: 'bitrate1',
    },
    channelId2: {
      url: 'url2',
      key: 'key2',
      bitrate: 'bitrate2',
    }
  };
  fetchLiveProgramInfoStub.returns(Promise.resolve(info));

  const result = await instance.setupStreamSettings();
  t.deepEqual(showWindowStub.args[0][0].queryParams, info, 'ポップアップに番組設定を渡す');
  t.falsy(result.url, '空の配信設定を受け取る');
  t.true(result.asking, 'ポップアップを出す');
  t.true(updatePlatformChannelIdStub.notCalled, 'チャンネルIDは通知しない');
  t.true(setSettingsStub.notCalled, '配信設定は更新しない');
});
