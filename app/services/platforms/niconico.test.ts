import { sleep } from 'util/sleep';
import { createSetupFunction } from 'util/test-setup';

const setup = createSetupFunction({
  injectee: {
    HostsService: {},
    SettingsService: {},
    UserService: {},
    StreamingService: {
      streamingStatusChange: {
        subscribe() {},
      },
    },
    WindowsService: {},
  },
});

beforeEach(() => {
  jest.resetModules();

  jest.mock('services/stateful-service');
  jest.mock('util/injector');
  jest.mock('services/streaming', () => ({}));
  jest.mock('services/user', () => ({}));
  jest.mock('services/settings', () => ({}));
  jest.mock('services/windows', () => ({}));
  jest.mock('util/sleep', () => ({
    sleep: () => sleep(0),
  }));
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

  const result = await instance.setupStreamSettings();
  expect(result.url).toEqual('');
  expect(result.asking).toBe(false);
  expect(instance.fetchLiveProgramInfo).toHaveBeenCalledTimes(2);
});

test('setupStreamSettingsで番組がひとつある場合', async () => {
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
    UserService: {
      updatePlatformChannelId,
    },
    SettingsService: {
      getSettingsFormData,
      setSettings,
    },
  };

  setup({ injectee });
  const { NiconicoService } = require('./niconico');
  const { instance } = NiconicoService;

  instance.fetchLiveProgramInfo = jest.fn().mockResolvedValue({
    channelId: {
      url: 'url1',
      key: 'key1',
      bitrate: 'bitrate1',
    },
  });

  const result = await instance.setupStreamSettings();
  expect(result.url).toBe('url1');
  expect(updatePlatformChannelId).toHaveBeenCalledTimes(1);
  expect(updatePlatformChannelId).toHaveBeenLastCalledWith('channelId');
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
      channelId: {
        url: 'url1',
        key: 'key1',
        bitrate: 'bitrate1',
      },
    });

  const result = await instance.setupStreamSettings();
  expect(result).toEqual({
    asking: false,
    url: 'url1',
    key: 'key1',
    bitrate: 'bitrate1',
  });
  expect(updatePlatformChannelId).toHaveBeenCalledTimes(1);
  expect(updatePlatformChannelId).toHaveBeenLastCalledWith('channelId');
  expect(setSettings).toHaveBeenCalledTimes(1);
  expect(setSettings.mock.calls[0]).toMatchSnapshot();
});

test('setupStreamSettingsで番組が複数ある場合', async () => {
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
      updatePlatformChannelId: updatePlatformChannelId,
    },
    SettingsService: {
      getSettingsFormData: getSettingsFormData,
      setSettings: setSettings,
    },
    WindowsService: {
      showWindow: showWindow,
    },
  };

  setup({ injectee });
  const { NiconicoService } = require('./niconico');
  const { instance } = NiconicoService;

  const info = {
    channelId1: { url: 'url1', key: 'key1', bitrate: 'bitrate1' },
    channelId2: { url: 'url2', key: 'key2', bitrate: 'bitrate2' },
  };
  instance.fetchLiveProgramInfo = jest.fn().mockResolvedValue(info);

  const result = await instance.setupStreamSettings();
  expect(result).toMatchInlineSnapshot(`
Object {
  "asking": true,
  "bitrate": undefined,
  "key": "",
  "url": "",
}
`);
  expect(showWindow.mock.calls[0]).toMatchSnapshot();

  expect(updatePlatformChannelId).not.toHaveBeenCalled();
  expect(setSettings).not.toHaveBeenCalled();
});
