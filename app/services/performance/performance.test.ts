import { createSetupFunction } from 'util/test-setup';
import { ipcRenderer } from 'electron';
const setup = createSetupFunction();

jest.mock('services/stateful-service');
jest.mock('util/injector');
jest.mock('services/settings', () => ({}));
jest.mock('services/customization', () => ({}));

beforeEach(() => {
  jest.resetModules();
});

test('get instance', () => {
  jest.doMock('electron', () => ({
    ipcRenderer: {
      send() {},
      on() {},
    },
  }));
  setup();
  const { PerformanceService } = require('./performance');
  expect(PerformanceService.instance).toBeInstanceOf(PerformanceService);
});

test('processPerformanceStats', () => {
  jest.doMock('electron', () => ({
    remote: {
      app: {
        getAppMetrics() {
          return [
            {
              cpu: {
                percentCPUUsage: 1,
              }
            },
            {
              cpu: {
                percentCPUUsage: 2,
              }
            }
          ];
        }
      },
    },
    ipcRenderer: {
      send() {},
      on() {},
    },
  }));
  setup();

  const { PerformanceService } = require('./performance');
  const { instance } = PerformanceService;
  instance.SET_PERFORMANCE_STATS = jest.fn();
  instance.processPerformanceStats({ dummy: 'obs result' });
  expect(instance.SET_PERFORMANCE_STATS).toHaveBeenNthCalledWith(1, {
    dummy: 'obs result', CPU: 3
  });
});
