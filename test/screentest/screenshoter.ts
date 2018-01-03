import { getClient } from '../helpers/api-client';
import { CustomizationService } from '../../app/services/customization';
import { execSync } from 'child_process';
import { getConfigsVariations, getConfig } from './utils';
import test from 'ava';

const fs = require('fs');
const CONFIG = getConfig();
const configs = getConfigsVariations();

let branchName: string;


export async function applyConfig(t: any, config: Dictionary<any>) {
  const api = await getClient();
  const customizationService = api.getResource<CustomizationService>('CustomizationService');

  customizationService.setNightMode(config.nightMode);

  t.context.app.browserWindow.setSize(
    config.resolution.width, config.resolution.height
  );
}


export async function makeScreenshots(t: any) {

  for (let configInd = 0; configInd < configs.length; configInd++) {
    const config = configs[configInd];
    await applyConfig(t, config);
    await t.context.app.browserWindow.capturePage().then((imageBuffer: ArrayBuffer) => {
      const testName = t['_test'].title.replace('afterEach for ', '');
      const imageFileName = `${testName}__${configInd}.png`;
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

