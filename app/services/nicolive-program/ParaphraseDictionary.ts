type replace_rules_type = {
  elements: {
    note?: string;
    regularExpression: string;
    replacement: string;
  }[];
};

const replace_rules = require('./replace_rules.json') as replace_rules_type;

export class ParaphraseDictionary {
  dictionary = replace_rules.elements.map(e => ({
    pattern: new RegExp(e.regularExpression, 'i'),
    to: e.replacement,
  }));

  process(input: string): string {
    return this.dictionary.reduce<string>((acc, item) => acc.replace(item.pattern, item.to), input);
  }
}
