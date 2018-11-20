import test from 'ava';
import * as Proxyquire from 'proxyquire';
import * as sinon from 'sinon';
import { merge } from 'lodash';

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
      Inject: createInject(injectees)
    },
    'services/file-manager': {},
    'electron': {},
  }, stubs);
}

function getModule(injectees = {}, stubs = {}) {
  return proxyquire('./state', getStub({injectees, stubs}));
}

function setupStatefulService(state = {}) {
  require('services/stateful-service')
    .StatefulService
    .setupVuexStore({ watch: identity, state });
}

test('get instance', t => {
  setupStatefulService()
  const m = getModule();
  t.truthy(m.SceneCollectionsStateService.instance, 'インスタンスが取れる');
});

test('loadManifestFileで初回起動の場合', async t => {
  setupStatefulService();

  const m = getModule();

  const { instance } = m.SceneCollectionsStateService;

  instance.ensureDirectory = sinon.stub();
  instance.flushManifestFile = sinon.stub();
  instance._loadManifestFile = sinon.stub().returns(Promise.resolve(null));
  instance.LOAD_STATE = sinon.stub();

  await instance.loadManifestFile();

  t.true(instance.LOAD_STATE.notCalled, '何も状態を受け取らない');
  t.true(instance._loadManifestFile.calledOnceWith(), 'オリジナルのmanifestだけを読みに行く');
});

test('loadManifestFileでオリジナルのmanifestが読める場合', async t => {
  setupStatefulService();

  const m = getModule();

  const { instance } = m.SceneCollectionsStateService;

  instance.ensureDirectory = sinon.stub();
  instance.flushManifestFile = sinon.stub();
  instance._loadManifestFile = sinon.stub().returns(Promise.resolve('original'));
  instance.LOAD_STATE = sinon.stub();

  await instance.loadManifestFile();

  t.true(instance._loadManifestFile.calledOnceWith(), 'オリジナルのmanifestだけを読みに行く');
  t.true(instance.LOAD_STATE.calledOnceWith('original'), 'オリジナルの中身を受け取る');
});

test('loadManifestFileでオリジナルのmanifestが読めない場合', async t => {
  setupStatefulService();

  const m = getModule();

  const { instance } = m.SceneCollectionsStateService;

  instance.ensureDirectory = sinon.stub();
  instance.flushManifestFile = sinon.stub();
  instance._loadManifestFile = sinon.stub();
  instance._loadManifestFile.withArgs().throws('some error');
  instance._loadManifestFile.withArgs(true).returns(Promise.resolve('backup'));
  instance.LOAD_STATE = sinon.stub();

  await instance.loadManifestFile();

  t.true(instance.LOAD_STATE.calledOnceWith('backup'), 'バックアップの中身を受け取る');
});

test('loadManifestFileでバックアップも読み取れない場合', async t => {
  setupStatefulService();

  const m = getModule();

  const { instance } = m.SceneCollectionsStateService;

  instance.ensureDirectory = sinon.stub();
  instance.flushManifestFile = sinon.stub();
  instance._loadManifestFile = sinon.stub();
  instance._loadManifestFile.withArgs().returns(Promise.reject('some error'));
  instance._loadManifestFile.withArgs(true).returns(Promise.reject('some error'));
  instance.LOAD_STATE = sinon.stub();

  await instance.loadManifestFile();

  t.true(instance.LOAD_STATE.notCalled, '何も状態を受け取らない');
});
