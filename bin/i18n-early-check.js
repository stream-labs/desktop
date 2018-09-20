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

function collectAcceptedAndRejectedValues(promises) {
  const withCatch = promises.map(
    p => p.then(
      value => ({ value, ok: true }),
      value => ({ value, ok: false })
    )
  );

  return Promise.all(withCatch)
    .then(results =>
      results.reduce((acc, cur) => {
        if (cur.ok) {
          acc.accepted.push(cur.value);
        } else {
          acc.rejected.push(cur.value);
        }
        return acc;
      }, {accepted: [], rejected: []})
    );
}

function enumerateKeys(o, path = [], result = []) {
  for (const key in o) {
    if (typeof o[key] !== 'object') {
      result.push([...path, key].join('.'));
    } else {
      enumerateKeys(o[key], [...path, key], result);
    }
  }
  return result;
}

async function loadAllJsons() {
  const dictDir = path.join(__dirname, '../app/i18n');
  const locales = await readdir(dictDir);
  const accepted = [];
  const rejected = [];
  for (const locale of locales) {
    const files = await readdir(path.join(dictDir, locale));
    const jsons = files.filter(x => x.endsWith('.json'));

    const tries = jsons
      .map(async json => {
        const filepath = path.join(dictDir, locale, json);
        const content = await readFile(filepath);
        try {
          return {locale, filename: json, content: JSON.parse(content)};
        } catch (e) {
          throw new Error(`in file: ${filepath}\n  ${e.message}`);
        }
      });

    values = await collectAcceptedAndRejectedValues(tries);
    accepted.push(...values.accepted);
    rejected.push(...values.rejected);
  }
  return {accepted, rejected};
}

/**
 * 
 * @param [{locale: string, filename: string, content: Object}] localeJsons 
 */
function checkKeys(localeJsons) {
  const result = [];

  const allLocales = Array.from(localeJsons.reduce((acc, cur) => acc.add(cur.locale), new Set()));

  const optionalKeys = new Set([
    'Output.Untitled.Mode.Simple',
    'Output.Untitled.Mode.Advanced',
    'Output.Streaming.StreamEncoder.obs_x264',
    'Output.Streaming.StreamEncoder.obs_qsv11',
    'Output.Streaming.rate_control.CBR',
    'Output.Streaming.rate_control.ABR',
    'Output.Streaming.rate_control.VBR',
    'Output.Streaming.rate_control.CRF',
    'Output.Recording.RecQuality.Stream',
    'Output.Recording.RecQuality.Small',
    'Output.Recording.RecQuality.HQ',
    'Output.Recording.RecQuality.Lossless',
    'Video.Untitled.ScaleType.bilinear',
    'Video.Untitled.ScaleType.bicubic',
    'Video.Untitled.ScaleType.lanczos',
    'Video.Untitled.FPSType.Common FPS Values',
    'Video.Untitled.FPSType.Integer FPS Value',
    'Video.Untitled.FPSType.Fractional FPS Value',
    'Advanced.Audio.MonitoringDeviceName.Default',
    'wasapi_input_capture.device_id.default',
    'wasapi_output_capture.device_id.default',
    'ndi_source.ndi_bw_mode.0',
    'ndi_source.ndi_bw_mode.1',
    'ndi_source.ndi_bw_mode.2',
    'ndi_source.ndi_sync.0',
    'ndi_source.ndi_sync.1',
  ]);

  const localesOfFiles = localeJsons
    .reduce((acc, cur) => {
      let {filename, locale, content} = cur;
      if (!acc.has(filename)) {
        acc.set(filename, new Map([[locale, content]]));
      } else {
        acc.get(filename).set(locale, content);
      }
      return acc;
    }, new Map());

  for (const [filename, localesOfAFile] of localesOfFiles) {
    const locales = Array.from(localesOfAFile);
    if (locales.length !== allLocales.length) {
      const missingLocales = allLocales.filter(v => !localesOfAFile.has(v));
      result.push(new Error(`file ${filename} is only in (${locales}), not in (${missingLocales})`));
    } else {
      const localesOfKeys = new Map();
      for (let [locale, content] of localesOfAFile) {
        for (key of enumerateKeys(content)) {
          if (!localesOfKeys.has(key)) {
            localesOfKeys.set(key, [locale]);
          } else {
            localesOfKeys.get(key).push(locale);
          }
        }
      }
      for (let [key, localesOfAKey] of localesOfKeys) {
        if (localesOfAKey.length !== allLocales.length) {
          if (key.endsWith('.name') || optionalKeys.has(key)) {
            continue;
          }
          const missingLocales = allLocales.filter(v => localesOfAKey.indexOf(v) < 0);
          const message = `${filename}: '${key}' is only in (${localesOfAKey}), not in (${missingLocales})`;
          result.push(new Error(message));
        }
      }
    }
  }
  return result;
}

loadAllJsons()
  .then(result => {
    if (result.rejected.length !== 0) {
      return result.rejected;
    }
    return checkKeys(result.accepted);
  })
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
