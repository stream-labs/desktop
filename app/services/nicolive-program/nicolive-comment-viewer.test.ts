import { createSetupFunction } from 'util/test-setup';
import { Subject } from 'rxjs';
type NicoliveCommentViewerService = import('./nicolive-comment-viewer').NicoliveCommentViewerService;

const setup = createSetupFunction();

jest.mock('services/nicolive-program/nicolive-program', () => ({ NicoliveProgramStateService: {} }));

beforeEach(() => {
  jest.doMock('services/stateful-service');
  jest.doMock('util/injector');
});

afterEach(() => {
  jest.resetModules();
});

test('接続先情報が来たら接続する', () => {
  const stateChange = new Subject();
  const clientSubject = new Subject();
  jest.doMock('./MessageServerClient', () => ({
    MessageServerClient: class MessageServerClient {
      connect() {
        return clientSubject;
      }
      requestLatestMessages() {}
    },
  }));
  setup({ injectee: { NicoliveProgramService: { stateChange } } });

  const { NicoliveCommentViewerService } = require('./nicolive-comment-viewer');
  const instance = NicoliveCommentViewerService.instance as NicoliveCommentViewerService;

  expect(clientSubject.observers).toHaveLength(0);
  expect(stateChange.observers).toHaveLength(1);
  stateChange.next({ roomURL: 'https://example.com', roomThreadID: '175622' });
  expect(clientSubject.observers).toHaveLength(1);
});

test('接続先情報が欠けていたら接続しない', () => {
  const stateChange = new Subject();
  const clientSubject = new Subject();
  jest.doMock('./MessageServerClient', () => ({
    MessageServerClient: class MessageServerClient {
      connect() {
        return clientSubject;
      }
      requestLatestMessages() {}
    },
  }));
  setup({ injectee: { NicoliveProgramService: { stateChange } } });

  const { NicoliveCommentViewerService } = require('./nicolive-comment-viewer');
  const instance = NicoliveCommentViewerService.instance as NicoliveCommentViewerService;

  expect(clientSubject.observers).toHaveLength(0);
  expect(stateChange.observers).toHaveLength(1);
  stateChange.next({ roomURL: 'https://example.com' });
  expect(clientSubject.observers).toHaveLength(0);
});

test('/disconnectが流れてきたらunsubscribeする', () => {
  const stateChange = new Subject();
  const clientSubject = new Subject();
  jest.doMock('./MessageServerClient', () => {
    return {
      ...jest.requireActual('./MessageServerClient'),
      MessageServerClient: class MessageServerClient {
        connect() {
          return clientSubject;
        }
        requestLatestMessages() {}
      },
    };
  });
  jest.spyOn(window, 'setTimeout').mockImplementation(callback => callback() as any);
  setup({ injectee: { NicoliveProgramService: { stateChange } } });

  const { NicoliveCommentViewerService } = require('./nicolive-comment-viewer');
  const instance = NicoliveCommentViewerService.instance as NicoliveCommentViewerService;
  const unsubscribe = jest.fn();
  (instance as any).unsubscribe = unsubscribe;

  expect(clientSubject.observers).toHaveLength(0);
  expect(unsubscribe).toHaveBeenCalledTimes(0);
  stateChange.next({ roomURL: 'https://example.com', roomThreadID: '175622' });
  expect(clientSubject.observers).toHaveLength(1);
  expect(unsubscribe).toHaveBeenCalledTimes(1);

  // 通常コメントではunsubscribeしない
  clientSubject.next({ chat: { premium: 1, content: '/disconnect' } });
  expect(unsubscribe).toHaveBeenCalledTimes(1);

  clientSubject.next({ chat: { premium: 2, content: '/disconnect' } });
  expect(unsubscribe).toHaveBeenCalledTimes(2);
});
