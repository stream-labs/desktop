import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { Observable } from 'rxjs';

export type MessageResponse = { chat: ChatMessage } | { leave_thread: LeaveThreadMessage } | { thread: ThreadMessage };
export type Message = ChatMessage | LeaveThreadMessage | ThreadMessage;

/** chatメッセージ（取得形のみ） */
export type ChatMessage = {
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

export function isChatMessage(msg: MessageResponse): msg is { chat: ChatMessage } {
  return msg.hasOwnProperty('chat');
}

export type LeaveThreadMessage = {
  thread?: string;
  service?: string;
  fork?: number;
  language?: number;
  reason?: 0 | 1 | 2 | 3;
};

export function isLeaveThreadMessage(msg: MessageResponse): msg is { leave_thread: LeaveThreadMessage } {
  return msg.hasOwnProperty('leave_thread');
}

export type ThreadMessage = {
  resultcode?: number;
  server_time?: number;
  // 使わないので省略
}

export function isThreadMessage(msg: MessageResponse): msg is { thread: ThreadMessage } {
  return msg.hasOwnProperty('thread');
}

export type MessageServerConfig = {
  roomURL: string,
  roomThreadID: string,
};

export class MessageServerClient {
  private roomURL: string | null = null;
  private roomThreadID: string | null = null;
  private socket: WebSocketSubject<MessageResponse> | null = null;

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

  connect(url: string = this.roomURL): Observable<MessageResponse> {
    this.socket = webSocket({
      url,
      protocol: 'msg.nicovideo.jp#json',
    });
    return this.socket.asObservable();
  }

  requestLatestMessages(thread: string = this.roomThreadID) {
    this.socket.next({
      thread: {
        thread,
        version: '20061206',
        fork: 0,
        res_from: -100,
        with_global: 1,
        scores: 1,
        nicoru: 0
      }
    } as any); // ここでしか送らないので型に含めない
  }
}
