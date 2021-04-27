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
