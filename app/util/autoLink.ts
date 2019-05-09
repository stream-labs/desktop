export function apply(value: string): string {
  const splitted = splitByRegExpWithMatchedValues(value, autoLinkMatcherPattern);
  const replaced = splitted.map((str, index) => {
    if (index % 2) return replaceWithFirstMatch(str);
    else return str;
  });
  return replaced.join('');
}

// URL検出正規表現生成用
const punct = "!'#%&\\(\\)\\*\\+,\\-\\./:;<=>\\?@[\\]^_{}~\\$、。　";
const spaces = '\\s\\u1680\\u180E\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000';
const invalidChars = '\\u{00}-\\u{2f}\\u{3a}-\\u{40}\\u{5b}-\\u{60}\\u{7b}-\\u{de}\\uFE74-\\uFFFF\\u202A-\\u202E';
const invalidCharsForDomain = punct + spaces + invalidChars;
const validCharsForDomain = `[^${invalidCharsForDomain}]`;
const validDomain = `(?:(?:${validCharsForDomain}+(?:[_-]|${validCharsForDomain})*)?${validCharsForDomain})`;
const domainPattern = `(?:${validDomain}\\.)+(?:${validDomain})`;
const urlPattern = `(https?://${domainPattern}(?::\\d+)?(?:/[^\\s<>'"、。　]*)?)`;

const urlRegExp = new RegExp(urlPattern, 'gu');

const autoLinkPatterns = [
  { matcher: /<[^?]*?>/, replace: '$&' },
  { matcher: urlRegExp, replace: '<a href="$&">$&</a>' },
  {
    matcher: /\b(?:sm|nm|ca|cd|ax|yo|nl|ig|na|cw|za|zb|zc|zd|ze|om|sk|yk|so|am|fz)\d+\b/,
    replace: '<a href="https://www.nicovideo.jp/watch/$&">$&</a>',
  },
  { matcher: /\bwatch\/\d+\b/, replace: '<a href="https://www.nicovideo.jp/$&">$&</a>' },
  { matcher: /\bmyvideo\/\d+\b/, replace: '<a href="https://www.nicovideo.jp/$&">$&</a>' },
  // negative lookbehindが使えないので user/\d+ より先にニコニコモンズユーザーページを判定させる
  { matcher: /\bniconicommons\.jp\/user\/\d+\b/, replace: '<a href="https://www.$&">$&</a>' },
  { matcher: /\buser\/\d+\b/, replace: '<a href="https://www.nicovideo.jp/$&">$&</a>' },
  { matcher: /\blv\d+\b/, replace: '<a href="https://live2.nicovideo.jp/watch/$&">$&</a>' },
  { matcher: /\bco\d+\b/, replace: '<a href="https://com.nicovideo.jp/community/$&">$&</a>' },
  { matcher: /\bmylist\/\d+(?:\/\d+)?\b/, replace: '<a href="https://www.nicovideo.jp/$&">$&</a>' },
  { matcher: /\bnc\d+\b/, replace: '<a href="https://www.niconicommons.jp/material/$&">$&</a>' },
  { matcher: /\bch\d+\b/, replace: '<a href="https://ch.nicovideo.jp/channel/$&">$&</a>' },
  {
    matcher: /\bch\.nicovideo\.jp\/[a-zA-Z0-9][-_a-zA-Z0-9]+(?=[^-_a-zA-Z0-9/]|$)\b/,
    replace: '<a href="https://$&">$&</a>',
  },
  { matcher: /\bar\d+\b/, replace: '<a href="https://ch.nicovideo.jp/article/$&">$&</a>' },
  { matcher: /\bim\d+\b/, replace: '<a href="https://seiga.nicovideo.jp/seiga/$&">$&</a>' },
  { matcher: /\b(?:clip|comic|user\/illust)\/\d+\b/, replace: '<a href="https://seiga.nicovideo.jp/$&">$&</a>' },
  { matcher: /\b(?:mg|bk|sg)\d+\b/, replace: '<a href="https://seiga.nicovideo.jp/watch/$&">$&</a>' },
  { matcher: /\btd\d+\b/, replace: '<a href="https://3d.nicovideo.jp/works/$&">$&</a>' },
  { matcher: /\bgm\d+\b/, replace: '<a href="https://game.nicovideo.jp/atsumaru/games/$&">$&</a>' },
  { matcher: /\bnw\d+\b/, replace: '<a href="https://news.nicovideo.jp/watch/$&">$&</a>' },
  { matcher: /\bap\d+\b/, replace: '<a href="https://app.nicovideo.jp/app/$&">$&</a>' },
  { matcher: /\bnq\d+\b/, replace: '<a href="https://q.nicovideo.jp/watch/$&">$&</a>' },
  { matcher: /\bkn\d+\b/, replace: '<a href="https://niconare.nicovideo.jp/watch/$&">$&</a>' },
  { matcher: /\bmt\d+\b/, replace: '<a href="https://mtm.nicovideo.jp/watch/$&">$&</a>' },
  {
    matcher: /\b(?:dw\d+|az[A-Z0-9]{10}|ys[a-zA-Z0-9-]+_[a-zA-Z0-9-]+|ga\d+|ip[\d_]+|gg[a-zA-Z0-9]+-[a-zA-Z0-9-]+)\b/,
    replace: '<a href="https://ichiba.nicovideo.jp/item/$&">$&</a>',
  },
  { matcher: /\bjps(\d+)\b/, replace: '<a href="https://jpstore.dwango.jp/products/detail.php?product_id=$1">$&</a>' },
];

function replaceWithFirstMatch(value: string): string {
  for (const pattern of autoLinkPatterns) {
    if (pattern.matcher.test(value)) {
      return value.replace(pattern.matcher, pattern.replace);
    }
  }
  throw new Error(`No pattern has matched with ${value}`);
}

/** 自動リンク対象の全パターンにマッチする正規表現オブジェクト */
const autoLinkMatcherPattern = new RegExp(
  autoLinkPatterns.map(p =>
    p.matcher
      .toString()
      .replace(/^\//, '') // 正規表現リテラルの先頭スラッシュを除去
      .replace(/\/[a-z]*$/, '') // 末尾スラッシュとフラグを除去
  ).reduce((a, b) => `${a}|${b}`),
  'gu' // URL検出パターンのためにuフラグが必須、位置保持のためにgフラグが必須
);

/**
 * export for testing
 * 正規表現でマッチする部分としない部分を分割する
 * マッチした部分は0-indexedで奇数番目に入る
 */
export function splitByRegExpWithMatchedValues(value: string, pat: RegExp): string[] {
  const result = [];
  let matched = null;
  let lastIndex = 0;

  while (matched = pat.exec(value)) {
    // 最後のマッチ位置からマッチしなかった部分があれば結果に追加
    result.push(value.slice(lastIndex, matched.index));

    // マッチした部分の末尾位置を記憶
    lastIndex = matched.index + matched[0].length;

    // 空文字列へのマッチが混入した場合、無限ループしないようにひとつ進める
    if (matched.index === pat.lastIndex) {
      pat.lastIndex += 1;
    }

    result.push(matched[0]);
  }

  const remains = value.slice(lastIndex);
  if (remains) {
    result.push(remains);
  }

  return result;
}
