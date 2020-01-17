import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { Subscription, Observer, PartialObserver, Subscriber } from 'rxjs';

/** chatメッセージ（取得形のみ） */
export type ChatMessage = {
  chat: {
    content?: string;
    date?: number;
    date_usec?: number;
    no?: number;
    premium?: number;
    thread?: number;
    user_id?: string;
    vpos?: number;
    anonymity?: number;
    mail?: string;
    score?: number;
  };
};

export function isChatMessage(msg: Message): msg is ChatMessage {
  return msg.hasOwnProperty('chat');
}

export type LeaveThreadMessage = {
  leave_thread: {
    thread: string;
    service: string;
    fork: number;
    language: number;
    reason?: 0 | 1 | 2 | 3;
  }
};

export function isLeaveThreadMessage(msg: Message): msg is LeaveThreadMessage {
  return msg.hasOwnProperty('leave_thread');
}

export type Message = ChatMessage | LeaveThreadMessage | {
  thread: {
    resultCode: number;
    thread: string;
    revision: number;
    server_time: number;
  };
};

export type MessageServerConfig = {
  roomURL: string,
  roomThreadID: string,
};

export class MessageServerClient {
  private roomURL: string | null = null;
  private roomThreadID: string | null = null;
  private socket: WebSocketSubject<Message> | null = null;
  private subscription: Subscription | null = null;
  private messageObserver: Observer<Message>;

  constructor({
    roomURL,
    roomThreadID,
  }: {
    roomURL: string,
    roomThreadID: string,
  }) {
    this.roomURL = roomURL;
    this.roomThreadID = roomThreadID;
  }

  onMessage(observer: PartialObserver<Message> | ((v: Message) => void)) {
    this.messageObserver = this.createObserver(observer);
  }

  private createObserver(observer: PartialObserver<Message> | ((v: Message) => void)) {
    const next = typeof observer === 'function' ? observer : observer.next ?? (() => {});
    const error = typeof observer !== 'function' && observer.error || undefined;
    const complete = typeof observer !== 'function' && observer.complete || undefined;
    const wrapped = (msg: Message) => {
      if (isLeaveThreadMessage(msg)) {
        const reason = msg.leave_thread.reason ?? 0;
        // 再接続したいけど
      }
      next(msg);
    };

    return new Subscriber(wrapped, error, complete);
  }

  connect(url: string = this.roomURL) {
    this.socket = webSocket({
      url,
      protocol: 'msg.nicovideo.jp#json',
    });
    return this.socket.asObservable();
  }

  requestLatestMessages(thread: string = this.roomThreadID) {
    this.joinThread(-200, thread);
  }

  joinThread(resFrom: number, thread: string = this.roomThreadID) {
    this.socket.next({
      thread: {
        thread,
        version: '20061206',
        fork: 0,
        res_from: resFrom,
        with_global: 1,
        scores: 1,
        nicoru: 0
      }
    } as any); // ここでしか送らないので型に含めない
  }
}
