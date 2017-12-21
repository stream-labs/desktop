import { getClient } from "../helpers/api-client";
import { CustomizationService } from "../../app/services/customization";
import test from "ava";
import { async } from "rxjs/scheduler/async";

const fs = require('fs');


const CONFIG_VARIATION = {
  resolution: [{ width: 1000, height: 700 }, { width: 1500, height: 900 }],
  // livedocIsOpen: [true, false],
  nightMode: [true, false]
};

/**
 * get set of unique configs
 */
function getConfigs() {
  const configKeys = Object.keys(CONFIG_VARIATION);
  let configs: Dictionary<any>[] = [];

  configKeys.forEach(configKey => {
    const values = CONFIG_VARIATION[configKey];
    const updatedConfigs: Dictionary<any>[] = [];
    values.forEach((value: any) => {
      if (!configs.length) {
        updatedConfigs.push({ [configKey]: value });
      } else {
        configs.forEach(config => {
          updatedConfigs.push(Object.assign({}, config, { [configKey]: value }));
        });
      }
    });
    configs = updatedConfigs;
  });
  return configs;
}

const configs = getConfigs();


export async function applyConfig(t: any, config: Dictionary<any>) {
  const api = await getClient();
  const customizationService = api.getResource<CustomizationService>('CustomizationService');

  customizationService.setNightMode(config.nightMode);

  t.context.app.browserWindow.setSize(
    config.resolution.width, config.resolution.height
  );
}


export async function makeScreenshots(t: any) {

  for (const config of configs) {
    await applyConfig(t, config);
    await t.context.app.browserWindow.capturePage().then((imageBuffer: ArrayBuffer) => {
      const testName = t['_test'].title.replace('afterEach for ', '');
      const imageFileName = testName + '__' + encodeURIComponent(JSON.stringify(config)) + '.png';
      console.log('image captured', testName);
      const dir = 'test-dist/screentest';
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);
      fs.writeFileSync(`${dir}/${imageFileName}`, imageBuffer);
    });
  }

}

export function useScreentest() {
  test.afterEach(async t => {
    await makeScreenshots(t);
  });
}

