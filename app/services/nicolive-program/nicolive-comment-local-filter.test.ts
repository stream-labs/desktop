import { createSetupFunction } from 'util/test-setup';
type NicoliveCommentLocalFilterService =
  import('./nicolive-comment-local-filter').NicoliveCommentLocalFilterService;

const setup = createSetupFunction({
  state: {
    NicoliveCommentLocalFilterService: {
      level: 'mid',
      showAnonymous: true,
    },
  },
});

function makeWrapper(value: object, type: 'normal' | 'system' = 'normal') {
  return {
    type,
    value,
    seqId: 0,
  };
}

beforeEach(() => {
  jest.doMock('services/core/stateful-service');
  jest.doMock('services/core/injector');
  jest.doMock('services/core/persistent-stateful-service', () => ({
    PersistentStatefulService: require('services/core/stateful-service').StatefulService,
  }));
});

afterEach(() => {
  jest.resetModules();
});

test('filterFn/初期値', async () => {
  setup();
  const { NicoliveCommentLocalFilterService } = require('./nicolive-comment-local-filter');
  const instance = NicoliveCommentLocalFilterService.instance as NicoliveCommentLocalFilterService;

  const { filterFn } = instance;
  expect(filterFn(makeWrapper({}))).toBe(true);
  expect(filterFn(makeWrapper({ score: -4799 }))).toBe(true);
  expect(filterFn(makeWrapper({ score: -4800 }))).toBe(false);
  expect(filterFn(makeWrapper({ anonymity: 1 }))).toBe(true);
  expect(filterFn(makeWrapper({ anonymity: 1 }, 'system'))).toBe(true);
});

test('filterFn/184非表示', async () => {
  setup();
  const { NicoliveCommentLocalFilterService } = require('./nicolive-comment-local-filter');
  const instance = NicoliveCommentLocalFilterService.instance as NicoliveCommentLocalFilterService;

  instance.showAnonymous = false;

  const { filterFn } = instance;
  expect(filterFn(makeWrapper({}))).toBe(true);
  expect(filterFn(makeWrapper({ anonymity: 1 }))).toBe(false);
  expect(filterFn(makeWrapper({ anonymity: 1 }, 'system'))).toBe(true);
});
