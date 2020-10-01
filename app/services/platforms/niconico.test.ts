import { createSetupFunction } from 'util/test-setup';
type NiconicoServise = import('./niconico').NiconicoService

const setup = createSetupFunction({
  injectee: {
    HostsService: {},
    SettingsService: {},
    UserService: {},
    StreamingService: {
      streamingStatusChange: {
        subscribe() { },
      },
    },
    WindowsService: {},
  },
});

jest.mock('services/stateful-service');
jest.mock('util/injector');
jest.mock('services/streaming', () => ({}));
jest.mock('services/user', () => ({}));
jest.mock('services/settings', () => ({}));
jest.mock('services/windows', () => ({}));
jest.mock('util/sleep', () => ({
  sleep: () => jest.requireActual('util/sleep').sleep(0),
}));
jest.mock('util/menus/Menu', () => ({}));
jest.mock('services/sources');
jest.mock('services/i18n', () => ({
  $t: (x: any) => x,
}));

const community = {
  providerType: 'community',
  name: 'community name',
  id: 'co12345',
  communityLevel: 1,
  thumbnailUrl: 'thumbnail url',
}
const channel1 = {
  providerType: 'channel',
  name: 'channel name1',
  id: 'ch12345',
  ownerName: 'owner1',
  thumbnailUrl: 'thumbnail url1',
  smallThumbnailUrl: 'small thumbnail url1',
}
const channel2 = {
  providerType: 'channel',
  name: 'channel name2',
  id: 'ch123456',
  ownerName: 'owner2',
  thumbnailUrl: 'thumbnail url2',
  smallThumbnailUrl: 'small thumbnail url2',
}

beforeEach(() => {
  jest.resetModules();
});

test('get instance', () => {
  setup();
  const { NiconicoService } = require('./niconico');
  expect(NiconicoService.instance).toBeInstanceOf(NiconicoService);
});

test('setupStreamSettingsで番組がない場合', async () => {
  setup();
  const { NiconicoService } = require('./niconico');
  const { instance } = NiconicoService;

  instance.fetchLiveProgramInfo = jest.fn().mockResolvedValue({});
  instance.client.fetchProgram = jest.fn();

  const result = await instance.setupStreamSettings();
  expect(result.url).toEqual('');
  expect(result.asking).toBe(false);
  expect(instance.fetchLiveProgramInfo).toHaveBeenCalledTimes(2);
});

test('setupStreamSettingsで番組がひとつある場合', async () => {
  const updatePlatformChannelId = jest.fn();
  const getSettingsFormData = jest.fn();
  const setSettings = jest.fn();
  const showWindow = jest.fn();

  getSettingsFormData.mockReturnValue([
    {
      nameSubCategory: 'Untitled',
      parameters: [{ name: 'service', value: '' }, { name: 'server', value: '' }, { name: 'key', value: '' }],
    },
  ]);

  const injectee = {
    UserService: {
      updatePlatformChannelId,
    },
    SettingsService: {
      getSettingsFormData,
      setSettings,
    },
    WindowsService: {
      showWindow: showWindow,
    },
  };

  setup({ injectee });
  const { NiconicoService } = require('./niconico');
  const { instance } = NiconicoService;

  instance.fetchOnairUserProgram = jest.fn(() => Promise.resolve({
    programId: 'lv12345'
  }));
  instance.fetchOnairChannnels = jest.fn(() => Promise.resolve([]))
  instance.fetchOnairChannelProgram = jest.fn((channelId: string) => Promise.reject())
  instance.client.fetchProgram = jest.fn((programId: string) => Promise.resolve({
    ok: true,
    value: {
      socialGroup: community
    }
  }));
  instance.fetchBroadcastStream = jest.fn((programId: string) => Promise.resolve({
    url: 'url1',
    name: 'key1'
  }));
  instance.fetchMaxBitrate = jest.fn((programId: string) => Promise.resolve(6000));

  const programInfo = await instance.fetchLiveProgramInfo();
  const result = await instance.setupStreamSettings();
  expect(programInfo).toEqual({
    community: {
      type: 'community',
      id: community.id,
      name: community.name,
      thumbnailUrl: community.thumbnailUrl,
      broadcastablePrograms: [{ id: 'lv12345' }]
    },
    channels: undefined
  });
  expect(result.url).toBe('url1');
  expect(result.key).toBe('key1');
  expect(result.bitrate).toBe(6000);
  expect(updatePlatformChannelId).toHaveBeenCalledTimes(1);
  expect(updatePlatformChannelId).toHaveBeenLastCalledWith('co12345');
  expect(setSettings).toHaveBeenCalledTimes(1);
  expect(setSettings.mock.calls[0]).toMatchSnapshot();
});

test('setupStreamSettingsで番組取得にリトライで成功する場合', async () => {
  const updatePlatformChannelId = jest.fn();
  const getSettingsFormData = jest.fn();
  const setSettings = jest.fn();

  getSettingsFormData.mockReturnValue([
    {
      nameSubCategory: 'Untitled',
      parameters: [{ name: 'service', value: '' }, { name: 'server', value: '' }, { name: 'key', value: '' }],
    },
  ]);

  const injectee = {
    UserService: { updatePlatformChannelId: updatePlatformChannelId },
    SettingsService: { getSettingsFormData: getSettingsFormData, setSettings: setSettings },
  };

  setup({ injectee });
  const { NiconicoService } = require('./niconico');
  const { instance } = NiconicoService;

  instance.fetchLiveProgramInfo = jest
    .fn()
    .mockReturnValueOnce(Promise.resolve({}))
    .mockResolvedValue({
      community: {
        type: 'community',
        id: community.id,
        name: community.name,
        thumbnailUrl: community.thumbnailUrl,
        broadcastablePrograms: [{ id: 'lv12345' }]
      },
      channels: undefined,
    });
  instance.fetchBroadcastStream = jest.fn((programId: string) => Promise.resolve({
    url: 'url1',
    name: 'key1'
  }))
  instance.fetchMaxBitrate = jest.fn((programId: string) => Promise.resolve(6000));

  const result = await instance.setupStreamSettings();
  expect(result).toEqual({
    asking: false,
    url: 'url1',
    key: 'key1',
    bitrate: 6000,
  });
  expect(updatePlatformChannelId).toHaveBeenCalledTimes(1);
  expect(updatePlatformChannelId).toHaveBeenLastCalledWith(community.id);
  expect(setSettings).toHaveBeenCalledTimes(1);
  expect(setSettings.mock.calls[0]).toMatchSnapshot();
});

test('setupStreamSettingsでチャンネル番組が複数ある場合', async () => {
  const updatePlatformChannelId = jest.fn();
  const getSettingsFormData = jest.fn();
  const setSettings = jest.fn();
  const showWindow = jest.fn();

  getSettingsFormData.mockReturnValue([
    {
      nameSubCategory: 'Untitled',
      parameters: [{ name: 'service', value: '' }, { name: 'server', value: '' }, { name: 'key', value: '' }],
    },
  ]);

  const injectee = {
    UserService: {
      updatePlatformChannelId,
    },
    SettingsService: {
      getSettingsFormData,
      setSettings,
    },
    WindowsService: {
      showWindow: showWindow,
    },
  };

  setup({ injectee });
  const { NiconicoService } = require('./niconico');
  const { instance } = NiconicoService;

  instance.fetchOnairUserProgram = jest.fn(() => Promise.reject());
  instance.fetchOnairChannnels = jest.fn(() => Promise.resolve([
    {
      id: channel1.id,
      name: channel1.name,
      ownerName: channel1.ownerName,
      thumbnailUrl: channel1.thumbnailUrl,
      smallThumbnailUrl: channel1.smallThumbnailUrl,

    },
    {
      id: channel2.id,
      name: channel2.name,
      ownerName: channel2.ownerName,
      thumbnailUrl: channel2.thumbnailUrl,
      smallThumbnailUrl: channel2.smallThumbnailUrl,
    }
  ]))
  instance.fetchOnairChannelProgram = jest.fn((channelId: string) => {
    return channelId === channel1.id
      ? Promise.resolve({ programId: 'lv12345' })
      : Promise.resolve({ programId: 'lv123' });
  })
  instance.client.fetchProgram = jest.fn((programId: string) => Promise.reject());
  instance.fetchBroadcastStream = jest.fn((programId: string) => Promise.resolve({
    url: 'url1',
    name: 'key1'
  }))
  instance.fetchMaxBitrate = jest.fn((programId: string) => Promise.resolve(6000));

  const programInfo = await instance.fetchLiveProgramInfo();
  const result = await instance.setupStreamSettings();
  expect(programInfo).toEqual({
    community: undefined,
    channels: [
      {
        type: 'channel',
        id: channel1.id,
        name: channel1.name,
        thumbnailUrl: channel1.thumbnailUrl,
        broadcastablePrograms: [{ id: 'lv12345' }]
      },
      {
        type: 'channel',
        id: channel2.id,
        name: channel2.name,
        thumbnailUrl: channel2.thumbnailUrl,
        broadcastablePrograms: [{ id: 'lv123' }]
      }
    ],
  })
  expect(result.asking).toBe(true);
  expect(result.url).toBe('');
  expect(result.key).toBe('');
  expect(result.bitrate).toBe(undefined);
  expect(updatePlatformChannelId).toHaveBeenCalledTimes(0);
  expect(setSettings).toHaveBeenCalledTimes(0);
});
