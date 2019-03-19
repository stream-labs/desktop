import { createSetupFunction } from 'util/test-setup';
const setup = createSetupFunction();

jest.mock('services/stateful-service');
jest.mock('util/injector');
jest.mock('services/settings', () => ({}));
jest.mock('services/customization', () => ({}));

beforeEach(() => {
  jest.resetModules();
});

test('get instance', () => {
  jest.doMock('services/obs-api', () => ({}));
  setup();
  const { PerformanceService } = require('./performance');
  expect(PerformanceService.instance).toBeInstanceOf(PerformanceService);
});

test('getStatisticsでpollingPerformanceStatisticsがtrueの場合', () => {
  jest.doMock('services/obs-api', () => ({
    nodeObs: { OBS_API_getPerformanceStatistics: jest.fn().mockReturnValue('obs result') },
  }));
  setup({ injectee: { CustomizationService: { pollingPerformanceStatistics: true } } });

  const { PerformanceService } = require('./performance');
  const { instance } = PerformanceService;
  expect(instance.getStatistics()).toBe('obs result');
});

test('getStatisticsでpollingPerformanceStatisticsがfalseの場合', () => {
  const OBS_API_getPerformanceStatistics = jest.fn();
  jest.doMock('services/obs-api', () => ({
    nodeObs: {
      OBS_API_getPerformanceStatistics,
    },
  }));
  setup({ injectee: { CustomizationService: { pollingPerformanceStatistics: false } } });

  const { PerformanceService } = require('./performance');
  const { instance } = PerformanceService;
  expect(instance.getStatistics()).toEqual({});
  expect(OBS_API_getPerformanceStatistics).not.toHaveBeenCalled();
});
