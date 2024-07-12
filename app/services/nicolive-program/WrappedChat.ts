import { ChatMessage, GiftMessage, NicoadMessage } from './ChatMessage';
import { ChatMessageType } from './ChatMessage/classifier';
import { ChatComponentType } from './ChatMessage/ChatComponentType';

export type WrappedChat = {
  type: Exclude<ChatMessageType, 'nicoad' | 'gift'>;
  value: ChatMessage;
  seqId: number;
  /** NG追加したときに手元でフィルタをかけた結果 */
  filtered?: boolean;
  rawName?: string; // ピン留めコメント用にnameを保存
  isModerator?: boolean;
};

export type WrappedMessage =
  | WrappedChat
  | {
      type: 'nicoad';
      value: NicoadMessage;
      seqId: number;
    }
  | {
      type: 'gift';
      value: GiftMessage;
      seqId: number;
    };

export function isWrappedChat(chat: Pick<WrappedMessage, 'type' | 'value'>): chat is WrappedChat {
  return chat.type !== 'nicoad' && chat.type !== 'gift';
}

export type WrappedChatWithComponent = WrappedChat & { component: ChatComponentType };
export type WrappedMessageWithComponent = WrappedMessage & { component: ChatComponentType };
