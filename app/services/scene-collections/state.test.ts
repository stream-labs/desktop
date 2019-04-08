import { createSetupFunction } from 'util/test-setup';
jest.mock('services/stateful-service');
jest.mock('util/injector');

const setup = createSetupFunction();

test('get instance', () => {
  setup();
  const { SceneCollectionsStateService } = require('./state');
  expect(SceneCollectionsStateService.instance).toBeInstanceOf(SceneCollectionsStateService);
});

test('loadManifestFileで初回起動の場合', async () => {
  setup();
  const { SceneCollectionsStateService } = require('./state');
  const { instance } = SceneCollectionsStateService;

  instance.ensureDirectory = jest.fn();
  instance.flushManifestFile = jest.fn();
  instance._loadManifestFile = jest.fn().mockResolvedValue(null);
  instance.LOAD_STATE = jest.fn();

  await instance.loadManifestFile();

  expect(instance.LOAD_STATE).not.toBeCalled();
  expect(instance._loadManifestFile).toBeCalledTimes(1);
});

test('loadManifestFileでオリジナルのmanifestが読める場合', async () => {
  setup();
  const { SceneCollectionsStateService } = require('./state');
  const { instance } = SceneCollectionsStateService;

  instance.ensureDirectory = jest.fn();
  instance.flushManifestFile = jest.fn();
  instance._loadManifestFile = jest.fn().mockResolvedValue('original');
  instance.LOAD_STATE = jest.fn();

  await instance.loadManifestFile();

  expect(instance._loadManifestFile).toHaveBeenCalledTimes(1);
  expect(instance._loadManifestFile).toHaveBeenNthCalledWith(1);
  expect(instance.LOAD_STATE).toHaveBeenCalledTimes(1);
  expect(instance.LOAD_STATE).toHaveBeenNthCalledWith(1, 'original');
});

test('loadManifestFileでオリジナルのmanifestが読めない場合', async () => {
  setup();
  const { SceneCollectionsStateService } = require('./state');
  const { instance } = SceneCollectionsStateService;

  instance.ensureDirectory = jest.fn();
  instance.flushManifestFile = jest.fn();
  instance._loadManifestFile = jest.fn().mockImplementation(async (flag?: boolean) => {
    if (flag) return 'backup';
    throw new Error('some error');
  });
  instance.LOAD_STATE = jest.fn();

  await instance.loadManifestFile();

  expect(instance.LOAD_STATE).toHaveBeenCalledTimes(1);
  expect(instance.LOAD_STATE).toHaveBeenNthCalledWith(1, 'backup');
});

test('loadManifestFileでバックアップも読み取れない場合', async () => {
  setup();
  const { SceneCollectionsStateService } = require('./state');
  const { instance } = SceneCollectionsStateService;

  instance.ensureDirectory = jest.fn();
  instance.flushManifestFile = jest.fn();
  instance._loadManifestFile = jest.fn().mockRejectedValue(new Error('some error'));
  instance.LOAD_STATE = jest.fn();

  await instance.loadManifestFile();

  expect(instance.LOAD_STATE).not.toBeCalled();
});
