import { getClient } from '../helpers/api-client';
import { CustomizationService } from '../../app/services/customization';
import { getConfigsVariations, getConfig } from './utils';
import test from 'ava';
import { sleep } from '../helpers/sleep';
import { focusChild } from '../helpers/spectron/index';
import { PerformanceService } from '../../app/services/performance';
import { IAudioServiceApi } from '../../app/services/audio/audio-api';

const fs = require('fs');
const CONFIG = getConfig();
let configs: Dictionary<any>[];

let branchName: string;


export async function applyConfig(t: any, config: Dictionary<any>) {
  const api = await getClient();
  const customizationService = api.getResource<CustomizationService>('CustomizationService');

  customizationService.setNightMode(config.nightMode);

  if (config.resolution) {
    t.context.app.browserWindow.setSize(
      config.resolution.width, config.resolution.height
    );
  }

  await sleep(400);
}


export async function makeScreenshots(t: any, options: IScreentestOptions) {

  const api = await getClient();
  const performanceService = api.getResource<PerformanceService>('PerformanceService');
  const audioService = api.getResource<IAudioServiceApi>('AudioService');

  // tune services to have the same screenshots in any environment
  // PerformanceService causes different cpu usage
  performanceService.stop();
  // AudioSources causes a different volmeter level
  audioService.getSources().forEach(audioSource => audioSource.setMuted(true));


  if (options.window === 'child') {
    await focusChild(t);
  }

  configs = getConfigsVariations();
  const processedConfigs: string[] = [];

  for (let configInd = 0; configInd < configs.length; configInd++) {
    const config = configs[configInd];

    for (const paramName in config) {
      if (
        CONFIG.configs[paramName].window &&
        CONFIG.configs[paramName].window !== options.window
      ) delete config[paramName];
    }

    const configStr = JSON.stringify(config);
    if (processedConfigs.includes(configStr)) continue;
    processedConfigs.push(configStr);

    await applyConfig(t, config);
    await t.context.app.browserWindow.capturePage().then((imageBuffer: ArrayBuffer) => {
      const testName = t['_test'].title.replace('afterEach for ', '');
      const imageFileName = `${testName}__${configInd}.png`;
      fs.writeFileSync(`${CONFIG.dist}/${branchName}/${imageFileName}`, imageBuffer);
    });
  }

}

interface IScreentestOptions {
  window: 'main' | 'child';
}

export function useScreentest(options: IScreentestOptions = { window: 'main' }) {

  const currentBranchFile = `${CONFIG.dist}/current-branch.txt`;
  if (fs.existsSync(currentBranchFile)) {
    branchName = fs.readFileSync(currentBranchFile).toString();
  } else {
    branchName = CONFIG.baseBranch;
  }

  test.afterEach(async t => {
    await makeScreenshots(t, options);
  });
}

