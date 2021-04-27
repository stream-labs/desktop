import { WrappedChat } from './WrappedChat';

export function getContentWithFilter(wrapped: WrappedChat): string {
  if (wrapped.filtered) {
    return '##このコメントは表示されません##';
  }
  return wrapped.value.content ?? '';
}
