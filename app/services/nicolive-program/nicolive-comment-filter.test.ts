import { createSetupFunction } from 'util/test-setup';
import { Subject } from 'rxjs';
type NicoliveCommentFilterService = import('./nicolive-comment-filter').NicoliveCommentFilterService;

const setup = createSetupFunction({
  injectee: {
    NicoliveProgramService: {
      stateChange: new Subject(),
      state: {
        programID: 'lv175622',
      },
    },
  },
});

jest.mock('services/nicolive-program/nicolive-program', () => ({ NicoliveProgramStateService: {} }));

beforeEach(() => {
  jest.doMock('services/stateful-service');
  jest.doMock('util/injector');
});

afterEach(() => {
  jest.resetModules();
});

test('addFilters/通常成功', async () => {
  setup();
  const { NicoliveCommentFilterService } = require('./nicolive-comment-filter');
  const instance = NicoliveCommentFilterService.instance as NicoliveCommentFilterService;

  const addFilters = jest.fn().mockResolvedValue({ ok: true, value: [{ type: 'word', body: '810', id: 114514 }] });
  (instance as any).client.addFilters = addFilters;

  const UPDATE_FILTERS = jest.fn();
  (instance as any).UPDATE_FILTERS = UPDATE_FILTERS;

  await instance.addFilter({ type: 'word', body: '810' });

  expect(UPDATE_FILTERS).toHaveBeenCalledTimes(1);
  expect(UPDATE_FILTERS).toHaveBeenCalledWith([{ type: 'word', body: '810', id: 114514 }]);
});

test('addFilters/既に追加済みのとき', async () => {
  setup();
  const { NicoliveCommentFilterService } = require('./nicolive-comment-filter');
  const instance = NicoliveCommentFilterService.instance as NicoliveCommentFilterService;

  const addFilters = jest.fn().mockResolvedValue({ ok: true, value: [] });
  (instance as any).client.addFilters = addFilters;

  instance.fetchFilters = jest.fn();

  const UPDATE_FILTERS = jest.fn();
  (instance as any).UPDATE_FILTERS = UPDATE_FILTERS;

  await instance.addFilter({ type: 'word', body: '810' });

  expect(instance.fetchFilters).toHaveBeenCalledTimes(1);
  // fetchFiltersが処理するのでここでは呼ばれない
  expect(UPDATE_FILTERS).toHaveBeenCalledTimes(0);
});

test('deleteFilters', async () => {
  setup();
  const { NicoliveCommentFilterService } = require('./nicolive-comment-filter');
  const instance = NicoliveCommentFilterService.instance as NicoliveCommentFilterService;
  instance.state.filters = [{ type: 'word', body: '810', id: 114514 }, { type: 'word', body: 'yay', id: 114515 }];

  const deleteFilters = jest.fn().mockResolvedValue({ ok: true });
  (instance as any).client.deleteFilters = deleteFilters;

  const UPDATE_FILTERS = jest.fn();
  (instance as any).UPDATE_FILTERS = UPDATE_FILTERS;

  await instance.deleteFilters([114514]);

  expect(UPDATE_FILTERS).toHaveBeenCalledTimes(1);
  expect(UPDATE_FILTERS).toHaveBeenCalledWith([{ type: 'word', body: 'yay', id: 114515 }]);
});
