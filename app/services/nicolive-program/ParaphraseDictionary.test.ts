import { ParaphraseDictionary } from './ParaphraseDictionary';

test('PhraseDictionary', async () => {
  const dictionary = new ParaphraseDictionary();
  expect(dictionary.process('https://www.nicovideo.jp')).toBe('URLショウリャク');
  expect(dictionary.process('8888')).toBe('パチパチパチ');
  expect(dictionary.process('ww')).toBe('ワラワラ');
  expect(dictionary.process('テストw')).toBe('テスト、ワラ');
  expect(dictionary.process('複数行は\nすべて無視')).toBe('');
});
