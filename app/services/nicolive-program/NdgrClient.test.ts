import { dwango } from '@n-air-app/nicolive-comment-protobuf';
import { Reader, Writer, util } from 'protobufjs/minimal';
import { jest_fn } from 'util/jest_fn';
import { NdgrClient } from './NdgrClient';

const ENTRY_URL = 'http://example.com/entry';
const MESSAGES_URL = 'http://example.com/messages';
const PREV_MESSAGES_URL = 'http://example.com/prev';

// protobufjs は class 要素を objectに変換しようとすると toJSONメソッドが呼ばれるが、
// その変換ルールがデフォルトで Long と enum が Stringになってしまうので、Number に戻してアプリと挙動を合わせる
// (そうしないとエンコードしてデコードするときに元に戻らない)
util.toJSONOptions = { longs: Number, enums: Number, bytes: String };

const entries: dwango.nicolive.chat.service.edge.IChunkedEntry[] = [
  {
    segment: {
      uri: PREV_MESSAGES_URL,
    },
  },
  {
    segment: {
      uri: MESSAGES_URL,
    },
  },
];

const prevMessages: dwango.nicolive.chat.data.INicoliveMessage[] = [
  {
    moderatorUpdated: {
      operation: dwango.nicolive.chat.data.atoms.ModeratorUpdated.ModeratorOperation.ADD,
      operator: {
        userId: 3,
        nickname: 'prev',
      },
    },
  },
];

const messages: dwango.nicolive.chat.data.INicoliveMessage[] = [
  {
    moderatorUpdated: {
      operation: dwango.nicolive.chat.data.atoms.ModeratorUpdated.ModeratorOperation.ADD,
      operator: {
        userId: 1,
        nickname: 'test',
      },
    },
  },
  {
    moderatorUpdated: {
      operation: dwango.nicolive.chat.data.atoms.ModeratorUpdated.ModeratorOperation.DELETE,
      operator: {
        userId: 2,
        nickname: 'test2',
      },
    },
  },
];

function encodeMessages<T>(encoder: (message: T) => Writer, messages: T[]): Uint8Array {
  return messages
    .map(message => {
      const writer = encoder(message);
      return writer.finish();
    })
    .reduce((a, b) => new Uint8Array([...a, ...b]), new Uint8Array([]));
}

describe('ChunkedEntry', () => {
  test('EncodeDelimited して DecodeDelimited すると元のオブジェクトに戻る', () => {
    const buf = encodeMessages(
      msg => dwango.nicolive.chat.service.edge.ChunkedEntry.encodeDelimited(msg),
      entries,
    );

    const reader = Reader.create(buf);
    for (let i = 0; i < entries.length; i++) {
      const decoded = dwango.nicolive.chat.service.edge.ChunkedEntry.decodeDelimited(reader);
      expect(decoded).toEqual(entries[i]);
    }
  });
});

describe('NdgrClient', () => {
  // Date.now() を固定する
  const now = Date.now();
  jest.spyOn(Date, 'now').mockReturnValue(now);
  const ENTRY_URL_WITH_TIMESTAMP = `${ENTRY_URL}?at=now`;

  const fetchMock = jest_fn<typeof fetch>()
    .mockName('fetch')
    .mockImplementation((input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      if (typeof input === 'string') {
        const headers = new Headers();
        headers.append('Content-Type', 'application/octet-stream');
        const writer = new Writer();
        switch (input) {
          case ENTRY_URL_WITH_TIMESTAMP: {
            return Promise.resolve(
              new Response(
                encodeMessages(
                  msg => dwango.nicolive.chat.service.edge.ChunkedEntry.encodeDelimited(msg),
                  entries,
                ),
                { headers },
              ),
            );
          }

          case PREV_MESSAGES_URL:
            return Promise.resolve(
              new Response(
                encodeMessages(
                  msg => dwango.nicolive.chat.service.edge.ChunkedMessage.encodeDelimited(msg),
                  prevMessages.map(message => ({ message })),
                ),
                { headers },
              ),
            );

          case MESSAGES_URL:
            return Promise.resolve(
              new Response(
                encodeMessages(
                  msg => dwango.nicolive.chat.service.edge.ChunkedMessage.encodeDelimited(msg),
                  messages.map(message => ({ message })),
                ),
                { headers },
              ),
            );
        }
      }
      return Promise.reject(new Error(`Unknown URL: ${input}`));
    });
  global.fetch = fetchMock;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should emit received messages', async () => {
    const target = new NdgrClient(ENTRY_URL);
    const onReceived = jest
      .fn<void, [dwango.nicolive.chat.service.edge.IChunkedMessage]>()
      .mockName('onReceived');
    const onCompleted = jest.fn<void, []>().mockName('onCompleted');
    target.messages.subscribe({
      next: msg => onReceived(msg.toJSON()), // class情報を落とすことで比較可能にする
      complete: onCompleted,
    });
    await target.connect();
    expect(fetchMock).toHaveBeenNthCalledWith(1, ENTRY_URL_WITH_TIMESTAMP);
    expect(fetchMock).toHaveBeenNthCalledWith(2, PREV_MESSAGES_URL);
    expect(fetchMock).toHaveBeenNthCalledWith(3, MESSAGES_URL);

    const expectedMessages = [...prevMessages, ...messages];
    expect(onReceived).toHaveBeenCalledTimes(expectedMessages.length);
    for (let i = 0; i < expectedMessages.length; i++) {
      expect(onReceived).toHaveBeenNthCalledWith(i + 1, { message: expectedMessages[i] });
    }
    target.dispose();
    expect(onCompleted).toHaveBeenCalledTimes(1);
  });
});
