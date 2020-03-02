import { ChatMessage } from '../MessageServerClient';
import { isOperatorCommand, parseCommandName, isOperatorComment, parseContent } from './util';

/**
 * chatメッセージの表示パターン及び文言組み立てパターン振り分け用識別器
 * @param chat ChatMessage
 */
export function classify(chat: ChatMessage) {
  if (isOperatorComment(chat)) {
    return 'operator' as const;
  }
  if (isOperatorCommand(chat)) {
    const commandName = parseCommandName(chat).toLowerCase();
    switch (commandName) {
      case 'nicoad':
        return 'nicoad' as const;

      case 'gift':
        return 'gift' as const;

      case 'info': {
        const parsed = parseContent(chat);
        // コミュニティ参加通知は非表示
        if (parsed.values[0] === '2') {
          return 'invisible' as const;
        }
        return 'info' as const;
      }

      case 'perm':
        return 'operator' as const;

      case 'spi':
      case 'quote':
      case 'cruise':
        return 'system' as const;

      case 'disconnect': // 切断メッセージ
      case 'vote': // アンケート
      case 'coe': // 新市場
      case 'uadpoint': // ニコニ広告
        return 'invisible' as const;
    }
    return 'unknown' as const;
  }
  return 'normal' as const;
}

export type ChatMessageType = ReturnType<typeof classify> | 'n-air-emulated';
