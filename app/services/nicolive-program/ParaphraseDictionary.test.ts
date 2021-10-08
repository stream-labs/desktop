import { isText, ParaphraseDictionary, replace_rules, replace_text } from './ParaphraseDictionary';

describe('ParaphraseDictionary', async () => {
  const dictionary = new ParaphraseDictionary();
  test('remove URL', () =>
    expect(dictionary.process('https://www.nicovideo.jp')).toBe('URLショウリャク'));

  expect(dictionary.process('8888')).toBe('パチパチパチ');
  expect(dictionary.process('ww')).toBe('ワラワラ');
  expect(dictionary.process('テストw')).toBe('テスト、ワラ');

  test('remove multiple lines comments', () => {
    expect(dictionary.process('複数行は\nすべて無視')).toBe('');
    expect(dictionary.process('今\n北\n産\n業')).toBe('');
  });

  // 他の設定に影響を受けていないかどうか、全部試してみる
  const table = replace_rules.elements
    .filter(elem => isText(elem))
    .map<[string, string]>((elem: replace_text) => [elem.text, elem.replacement]);
  test.each(table)('text %s -> %s', (text, replace) =>
    expect(dictionary.process(text)).toBe(replace),
  );

  test('match multiple times', () => {
    const [text, replace] = table[0];
    expect(dictionary.process(`${text}${text}`)).toBe(`${replace}${replace}`);
  });
});
