import { ChatMessage } from '../ChatMessage';

function checkPremiumBit(premiumBit: number | undefined, checkBit: number): boolean {
  return premiumBit !== undefined && Boolean(premiumBit & checkBit);
}

export function isPremium(chat: ChatMessage): boolean {
  return checkPremiumBit(chat.premium, 0b1);
}

export function isOperator(chat: ChatMessage): boolean {
  return checkPremiumBit(chat.premium, 0b10) || checkPremiumBit(chat.premium, 0b100);
}

function isCommandContent(chat: ChatMessage): boolean {
  return Boolean(chat.content?.startsWith('/'));
}

export function isOperatorCommand(chat: ChatMessage): boolean {
  return isOperator(chat) && isCommandContent(chat);
}

export function isOperatorComment(chat: ChatMessage): boolean {
  return isOperator(chat) && !isCommandContent(chat);
}

export function isAnonymous(chat: ChatMessage): boolean {
  return chat.anonymity === 1;
}

export function getScore(chat: ChatMessage): number {
  return chat.score ?? 0;
}

export function parseCommandName(chat: ChatMessage): string {
  const matched = (chat.content ?? '').match(/^\/(\S+)\s*/);
  return matched && matched[1] ? matched[1] : '';
}

export function parseCommandArgument(chat: ChatMessage): string {
  const matched = (chat.content ?? '').match(/^\/\S+\s+(.+)/);
  return matched && matched[1] ? matched[1] : '';
}

export function parseJsonContent(chat: ChatMessage): { commandName: string; value: any } | null {
  const content = chat.content ?? '';
  const matched = content.match(/(\S+)\s+(.+)/);
  if (matched && matched.length > 2) {
    const [, commandName, maybeJsonArg] = matched;
    try {
      const parsed = JSON.parse(maybeJsonArg);
      if (typeof parsed === 'object') {
        return {
          commandName,
          value: parsed,
        };
      }
    } catch (err) {}
  }
  return null;
}

enum ParseState {
  init,
  reading,
  readingEsc,
  quoted,
  quotedEsc,
}

const SPACES = [' ', '\t'];

export function parseContent(chat: ChatMessage): { commandName: string; values: string[] } {
  const content = chat.content ?? '';
  const values = [];
  let currentStr = '';

  let state: ParseState = ParseState.init;

  for (const char of content) {
    switch (state) {
      case ParseState.init:
        if (SPACES.includes(char)) {
          state = ParseState.init;
        } else if (char === '"') {
          state = ParseState.quoted;
        } else if (char === '\\') {
          state = ParseState.readingEsc;
        } else {
          state = ParseState.reading;
          currentStr += char;
        }
        break;
      case ParseState.reading:
        if (SPACES.includes(char)) {
          values.push(currentStr);
          currentStr = '';
          state = ParseState.init;
        } else if (char === '\\') {
          state = ParseState.readingEsc;
        } else {
          currentStr += char;
        }
        break;
      case ParseState.readingEsc:
        currentStr += char;
        state = ParseState.reading;
        break;
      case ParseState.quoted:
        if (char === '"') {
          values.push(currentStr);
          currentStr = '';
          state = ParseState.init;
        } else if (char === '\\') {
          state = ParseState.quotedEsc;
        } else {
          currentStr += char;
        }
        break;
      case ParseState.quotedEsc:
        currentStr += char;
        state = ParseState.quoted;
        break;
    }
  }

  if (currentStr.length > 0) {
    values.push(currentStr);
  }

  const commandName = values[0].startsWith('/') ? values.shift() : '';

  return {
    commandName,
    values,
  };
}
