import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createSetupFunction } from 'util/test-setup';

jest.mock('services/stateful-service');
jest.mock('util/injector');
jest.mock('../../../obs-api', () => ({
  Global: {},
}));
jest.mock('services/app', () => ({}));
jest.mock('components/shared/forms/Input', () => ({}));

const setup = createSetupFunction({
  injectee: {
    FileManagerService: {
      read(filename: string) {
        return readFileSync(filename, 'utf-8');
      },
      resolve(filepath: string) {
        return resolve(filepath);
      },
    },
  },
  state: {
    I18nService: {},
  },
});

test('get instance', () => {
  setup();
  const { I18nService } = require('./i18n');
  expect(I18nService.instance).toBeInstanceOf(I18nService);
});

test('load', async () => {
  setup();
  const { I18nService } = require('./i18n');
  const { instance } = I18nService;
  await instance.load();
  expect(instance.isLoaded).toBe(true);
  expect(typeof instance.state.locale).toBe('string');
  expect(instance.availableLocales).toMatchSnapshot();
});
