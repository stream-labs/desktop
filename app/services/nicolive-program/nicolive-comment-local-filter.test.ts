import { createSetupFunction } from 'util/test-setup';
type NicoliveCommentLocalFilterService = import('./nicolive-comment-local-filter').NicoliveCommentLocalFilterService;

const setup = createSetupFunction({
  state: {
    NicoliveCommentLocalFilterService: {
      level: 'mid',
      showAnonymous: true,
    },
  },
});

beforeEach(() => {
  jest.doMock('services/stateful-service');
  jest.doMock('util/injector');
  jest.doMock('services/persistent-stateful-service', () => ({
    PersistentStatefulService: require('services/stateful-service').StatefulService,
  }));
});

afterEach(() => {
  jest.resetModules();
});

test('filterFn/初期値', async () => {
  setup();
  const { NicoliveCommentLocalFilterService } = require('./nicolive-comment-local-filter');
  const instance = NicoliveCommentLocalFilterService.instance as NicoliveCommentLocalFilterService;

  expect(instance.filterFn({})).toBe(true);
  expect(instance.filterFn({ score: -4799 })).toBe(true);
  expect(instance.filterFn({ score: -4800 })).toBe(false);
  expect(instance.filterFn({ anonymity: 1 })).toBe(true);
});

test('filterFn/184非表示', async () => {
  setup();
  const { NicoliveCommentLocalFilterService } = require('./nicolive-comment-local-filter');
  const instance = NicoliveCommentLocalFilterService.instance as NicoliveCommentLocalFilterService;

  instance.showAnonymous = false;

  expect(instance.filterFn({})).toBe(true);
  expect(instance.filterFn({ anonymity: 1 })).toBe(false);
});
