import { dwango } from '@n-air-app/nicolive-comment-protobuf';
import { Reader, Writer, util } from 'protobufjs/minimal';
import { jest_fn } from 'util/jest_fn';
import { NdgrClient } from './NdgrClient';

const ENTRY_URL = 'http://example.com/entry';
const MESSAGES_URL = 'http://example.com/messages';

// protobufjs は class 要素を objectに変換しようとすると toJSONメソッドが呼ばれるが、
// その変換ルールがデフォルトで Long と enum が Stringになってしまうので、Number に戻してアプリと挙動を合わせる
// (そうしないとエンコードしてデコードするときに元に戻らない)
util.toJSONOptions = { longs: Number, enums: Number, bytes: String };

const entries: dwango.nicolive.chat.service.edge.IChunkedEntry[] = [
  {
    segment: {
      uri: MESSAGES_URL,
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
  const ENTRY_URL_WITH_TIMESTAMP = `${ENTRY_URL}?at=${Math.floor(now / 1000)}`;

  const fetchMock = jest_fn<typeof fetch>().mockImplementation(
    (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
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
    },
  );
  global.fetch = fetchMock;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should emit received messages', async () => {
    const target = new NdgrClient(ENTRY_URL);
    const onReceived = jest.fn<void, [dwango.nicolive.chat.service.edge.IChunkedMessage]>();
    const onCompleted = jest.fn<void, []>();
    target.messages.subscribe({
      next: msg => onReceived(msg.toJSON()), // class情報を落とすことで比較可能にする
      complete: onCompleted,
    });
    await target.connect();
    expect(fetchMock).toHaveBeenNthCalledWith(1, ENTRY_URL_WITH_TIMESTAMP);
    expect(fetchMock).toHaveBeenNthCalledWith(2, MESSAGES_URL);

    expect(onReceived).toBeCalledTimes(2);
    for (let i = 0; i < 2; i++) {
      expect(onReceived).toHaveBeenNthCalledWith(i + 1, { message: messages[i] });
    }
    target.dispose();
    expect(onCompleted).toBeCalledTimes(1);
  });
});
