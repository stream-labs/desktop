import { getClient } from '../helpers/api-client';
import { CustomizationService } from '../../app/services/customization';
import { execSync } from 'child_process';
import test from 'ava';

const fs = require('fs');
const CONFIG = JSON.parse(fs.readFileSync('test/screentest/config.json'));
const CONFIG_VARIATION = CONFIG.configs;

let branchName: string;

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
      const dir = `${CONFIG.dist}/${branchName}`;
      fs.writeFileSync(`${dir}/${imageFileName}`, imageBuffer);
    });
  }

}

export function useScreentest() {

  branchName = execSync('git status').toString().replace('On branch ', '').split('\n')[0];

  test.afterEach(async t => {
    await makeScreenshots(t);
  });
}

