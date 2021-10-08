export type replace_regular_expression = {
  note?: string;
  regularExpression: string;
  replacement: string;
};
export type replace_text = { note?: string; text: string; replacement: string };
export type replace_item = replace_regular_expression | replace_text;

export type replace_rules_type = { elements: replace_item[] };

export const replace_rules = require('./replace_rules.json') as replace_rules_type;

export function isText(r: replace_item): r is replace_text {
  return (r as unknown as replace_text).text !== undefined;
}

function escapeStringRegexp(string: string): string {
  return string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
}

export class ParaphraseDictionary {
  dictionary = replace_rules.elements.map(e => ({
    pattern: new RegExp(isText(e) ? escapeStringRegexp(e.text) : e.regularExpression, 'gi'),
    to: e.replacement,
  }));

  process(input: string): string {
    return this.dictionary.reduce<string>((acc, item) => acc.replace(item.pattern, item.to), input);
  }
}
