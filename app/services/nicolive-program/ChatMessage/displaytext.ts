import { getContentWithFilter } from '../getContentWithFilter';
import { WrappedChat, WrappedChatWithComponent } from '../WrappedChat';
import { ChatComponentType } from './ChatComponentType';
import { parseCommandArgument, parseContent, parseJsonContent } from './util';

function getCommonComment(chat: WrappedChat): string {
  if (chat.type === 'normal') {
    return getContentWithFilter(chat);
  }
  const parsed = parseContent(chat.value);
  return parsed.values.join(' ');
}

function getNicoadComment(chat: WrappedChat): string {
  const parsed = parseJsonContent(chat.value);
  return parsed.value.message ?? '';
}

function getGiftComment(chat: WrappedChat): string {
  const parsed = parseContent(chat.value);
  const [_itemId, _userId, advertiserName, point, _message, itemName, contributionRank] =
    parsed.values;
  const contributionMessage = contributionRank ? `【ギフト貢献第${contributionRank}位】 ` : '';
  return `${contributionMessage}${advertiserName}さんが「${itemName}（${point}pt）」を贈りました`;
}

function getEmotionComment(chat: WrappedChat): string {
  return parseCommandArgument(chat.value);
}

function getSystemMessage(chat: WrappedChat): string {
  const parsed = parseContent(chat.value);
  if (chat.type === 'unknown') {
    return `${parsed.commandName} ${parsed.values.join(' ')}`;
  }
  if (chat.type === 'info') {
    // info種別を除去
    parsed.values.shift();
  }
  return parsed.values.join(' ');
}

const displayTextMap: { [type in ChatComponentType]: (chat: WrappedChat) => string } = {
  common: getCommonComment,
  nicoad: getNicoadComment,
  gift: getGiftComment,
  emotion: getEmotionComment,
  system: getSystemMessage,
};

export function getDisplayText(chat: WrappedChatWithComponent): string {
  return displayTextMap[chat.component](chat);
}
