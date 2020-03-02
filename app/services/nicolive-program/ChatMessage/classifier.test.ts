import { classify } from './classifier';

function make(content: string) {
  return { premium: 0b11, content };
}

test('通常コメント', () => {
  expect(classify({ content: 'comment' })).toBe('normal');
});

test('プレミアム会員の通常コメント', () => {
  expect(classify({ premium: 1, content: 'comment' })).toBe('normal');
});

test('放送者コメント', () => {
  expect(classify(make('comment'))).toBe('operator');
});

test('固定表示の放送者コメント', () => {
  expect(classify(make('/perm comment'))).toBe('operator');
});

test('ニコニ広告', () => {
  expect(classify(make('/nicoad ...args'))).toBe('nicoad');
});

test('ギフト', () => {
  expect(classify(make('/gift ...args'))).toBe('gift');
});

test('info', () => {
  expect(classify(make('/info 1 ...args'))).toBe('info');
  expect(classify(make('/info 2 ...args'))).toBe('invisible');
  expect(classify(make('/info 3 ...args'))).toBe('info');
  expect(classify(make('/info 4 ...args'))).toBe('info');
  expect(classify(make('/info 5 ...args'))).toBe('info');
  expect(classify(make('/info 6 ...args'))).toBe('info');
});

test('system', () => {
  expect(classify(make('/spi ...args'))).toBe('system');
  expect(classify(make('/quote ...args'))).toBe('system');
  expect(classify(make('/cruise ...args'))).toBe('system');
});

test('invisible', () => {
  expect(classify(make('/disconnect'))).toBe('invisible');
  expect(classify(make('/vote'))).toBe('invisible');
  expect(classify(make('/coe'))).toBe('invisible');
  expect(classify(make('/uadpoint'))).toBe('invisible');
});
