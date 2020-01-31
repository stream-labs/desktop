import { ChatMessage } from '../MessageServerClient';
import { isOperatorCommand, parseCommandName, isOperatorComment } from './util';

export function classify(chat: ChatMessage) {
  if (isOperatorComment(chat)) {
    return 'operator' as const;
  }
  if (isOperatorCommand(chat)) {
    const commandName = parseCommandName(chat).toLowerCase();
    switch (commandName) {
      case 'nicoad': return 'nicoad' as const;
      case 'gift': return 'gift' as const;
      case 'spi': return 'spi' as const;
      case 'quote': return 'quote' as const;
      case 'cruise': return 'cruise' as const;
      case 'info': return 'info' as const;
      case 'perm': return 'operator' as const;
    }
    return 'unknown' as const;
  }
  return 'normal' as const;
}

export type ChatMessageType = ReturnType<typeof classify> | 'n-air-emulated';
