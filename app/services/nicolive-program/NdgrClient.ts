import { dwango, google } from '@n-air-app/nicolive-comment-protobuf';
import Long from 'long';
import { Reader } from 'protobufjs/minimal';
import { Subject } from 'rxjs';
import { FilterType } from './ResponseTypes';

export function toNumber(num: Long | number): number {
  if (typeof num === 'number') {
    return num;
  }
  return num.toNumber();
}

export function toISO8601(timestamp: google.protobuf.ITimestamp): string {
  return new Date(toNumber(timestamp.seconds) * 1000).toISOString();
}

export function convertSSNGType(
  type: dwango.nicolive.chat.data.atoms.SSNGUpdated.SSNGType,
): FilterType {
  switch (type) {
    case dwango.nicolive.chat.data.atoms.SSNGUpdated.SSNGType.USER:
      return 'user';
    case dwango.nicolive.chat.data.atoms.SSNGUpdated.SSNGType.WORD:
      return 'word';
    case dwango.nicolive.chat.data.atoms.SSNGUpdated.SSNGType.COMMAND:
      return 'command';
    default:
      throw new Error(`Unknown SSNGType: ${type}`);
  }
}

export class NdgrClient {
  private isDisposed: boolean = false;
  public messages: Subject<dwango.nicolive.chat.service.edge.ChunkedMessage>;

  /**
   * @param uri 接続するURI
   * @param label デバッグログ識別用ラベル
   */
  constructor(private uri: string, private label = 'ndgr') {
    this.messages = new Subject();
  }

  public async connect(from_unix_time?: number): Promise<void> {
    if (!from_unix_time) {
      from_unix_time = Math.floor(Date.now() / 1000);
    }
    let next: number | Long = from_unix_time;
    while (next && !this.isDisposed) {
      const fetchUri = this.uri + '?at=' + next;
      next = null;
      for await (const entry of this.retrieve(fetchUri, reader =>
        dwango.nicolive.chat.service.edge.ChunkedEntry.decodeDelimited(reader),
      )) {
        if (entry.segment != null) {
          await this.retrieveMessages(entry.segment.uri);
        } else if (entry.next != null) {
          next = entry.next.at;
        }
      }
    }
  }

  private async retrieveMessages(uri: string): Promise<void> {
    for await (const msg of this.retrieve(uri, reader =>
      dwango.nicolive.chat.service.edge.ChunkedMessage.decodeDelimited(reader),
    )) {
      if (this.isDisposed) return;
      this.messages.next(msg);
      if (msg.state != null) {
        this.updateState(msg);
      }
    }
  }

  private async *retrieve<T>(
    uri: string,
    decoder: (reader: Reader) => T,
  ): AsyncGenerator<T, void, undefined> {
    let unread = new Uint8Array();
    const response = await fetch(uri);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const buffer = Reader.create(new Uint8Array([...unread, ...value]));
      try {
        while (buffer.pos < buffer.len) {
          const msg = decoder(buffer);
          yield msg;
        }
        unread = new Uint8Array();
      } catch (error) {
        if (error instanceof RangeError) {
          //protobufが途中でちぎれていた場合RangeErrorになるので未読分をunreadにつめる
          unread = buffer.buf.slice(buffer.pos); // Save unread part
        } else {
          throw error;
        }
        break;
      }
    }
  }

  private updateState(msg: dwango.nicolive.chat.service.edge.ChunkedMessage): void {
    // 現在は不要だが、将来状態更新するときここに書く
  }

  public dispose(): void {
    this.isDisposed = true;
    this.messages.complete();
  }
}
