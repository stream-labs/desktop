import { ChatMessage } from '../MessageServerClient';
import { isOperatorCommand, parseCommandName, isOperatorComment } from './util';

export function classify(chat: ChatMessage) {
  if (isOperatorComment(chat)) {
    return 'operator';
  }
  if (isOperatorCommand(chat)) {
    const commandName = parseCommandName(chat).toLowerCase();
    switch (commandName) {
      case 'nicoad':
      case 'gift':
      case 'spi':
      case 'quote':
      case 'cruise':
      case 'info':
        return commandName;
      case 'perm':
        return 'operator';
    }
    return 'unknown';
  }
  return 'normal';
}

export type ChatMessageType = ReturnType<typeof classify>;
