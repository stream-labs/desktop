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
    'services/obs-api': {},
    'services/settings': {},
    'services/customization': {},
    'vue': {},
    'electron': {}
  }, stubs);
}

const createInjectees = ({
  pollingPerformanceStatistics = true,
} = {}) => ({
  CustomizationService: {
    pollingPerformanceStatistics
  }
});

const createStubs = ({
  OBS_API_getPerformanceStatistics = noop,
} = {}) => ({
  'services/obs-api': {
    nodeObs: {
      OBS_API_getPerformanceStatistics
    }
  }
});

function getModule(injectees = createInjectees(), stubs = createStubs()) {
  return proxyquire('./performance', getStub({injectees, stubs}));
}

function setupStatefulService(state = {}) {
  require('services/stateful-service')
    .StatefulService
    .setupVuexStore({ watch: identity, state });
}

test.beforeEach('setIntervalをstub化', t => {
  const setInterval = sinon.stub();
  (global as any).setInterval = setInterval;
  t.context.setInterval = setInterval;
});

test.afterEach.always('setIntervalをrestore', t => {
  delete (global as any).setInterval;
});

test('get instance', t => {
  setupStatefulService()
  const m = getModule();
  t.truthy(m.PerformanceService.instance, 'インスタンスが取れる');
});

test('getStatisticsでpollingPerformanceStatisticsがtrueの場合', t => {
  setupStatefulService();

  const OBS_API_getPerformanceStatistics = sinon.stub().returns('obs result');
  const pollingPerformanceStatistics = true;

  const m = getModule(createInjectees({
    pollingPerformanceStatistics
  }), createStubs({
    OBS_API_getPerformanceStatistics
  }));

  const { instance } = m.PerformanceService;
  const result = instance.getStatistics();

  t.true(OBS_API_getPerformanceStatistics.calledOnce, 'OBSのAPIを呼んでいる');
  t.is('obs result', result, 'OBSのAPIを呼んだ結果が返ってくる');
});

test('getStatisticsでpollingPerformanceStatisticsがfalseの場合', t => {
  setupStatefulService();

  const OBS_API_getPerformanceStatistics = sinon.stub().returns('obs result');
  const pollingPerformanceStatistics = false;

  const m = getModule(createInjectees({
    pollingPerformanceStatistics
  }), createStubs({
    OBS_API_getPerformanceStatistics
  }));

  const { instance } = m.PerformanceService;
  const result = instance.getStatistics();

  t.true(OBS_API_getPerformanceStatistics.notCalled, 'OBSのAPIを呼ばない');
  t.deepEqual({}, result, '空のオブジェクトが返ってくる');
});
