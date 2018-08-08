/*
 辞書ファイルがパース可能かをチェックする
*/

const fs = require('fs');
const path = require('path');

function readdir(dirname) {
  return new Promise((resolve, reject) => {
    fs.readdir(dirname, (err, files) => {
      if (err) reject(err);
      else resolve(files);
    });
  });
}

function readFile(filepath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filepath, 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

function collectRejectedValues(promises) {
  const withCatch = promises.map(
    p => p.then(
      value => ({ value, ok: true }),
      value => ({ value, ok: false })
    )
  );

  return Promise.all(withCatch)
    .then(results =>
      results
        .filter(({ ok }) => !ok)
        .map(({ value }) => value)
    );
}

async function main() {
  const dictDir = path.join(__dirname, '../app/i18n');
  const locales = await readdir(dictDir);
  const result = [];
  for (const locale of locales) {
    const files = await readdir(path.join(dictDir, locale));
    const jsons = files.filter(x => x.endsWith('.json'));
    const filepaths = jsons.map(json => path.join(dictDir, locale, json));

    const tries = filepaths
      .map(async filepath => {
        const content = await readFile(filepath);
        try {
          return JSON.parse(content);
        } catch (e) {
          throw new Error(`in file: ${filepath}\n  ${e.message}`);
        }
      });
    const rejectedValues = await collectRejectedValues(tries);
    result.push(...rejectedValues);
  }
  return result;
}

main()
  .then(result => {
    if (result.length) {
      console.error(`\u001b[31mError in early check\u001b[0m: ${result.length} errors found`);
      console.error(result.map(e => e.message).join('\n'));
      process.exit(1);
    }
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
