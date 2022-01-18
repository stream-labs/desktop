import { getApiClient } from '../helpers/api-client';
import { CustomizationService } from '../../app/services/customization';
import { getConfigsVariations, getConfig } from './utils';
import test from 'ava';
import { sleep } from '../helpers/sleep';
import { afterAppStart, TExecutionContext } from '../helpers/spectron';
import { PerformanceService } from '../../app/services/performance';
import { IAudioServiceApi } from '../../app/services/audio';
import { WindowsService } from '../../app/services/windows';
import NativeImage = Electron.NativeImage;
import {focusChild, focusMain} from "../helpers/modules/core";

const fs = require('fs');
const CONFIG = getConfig();
let configs: Dictionary<any>[];

let branchName: string;
let screenshotsCaptured = false;

async function applyConfig(t: TExecutionContext, config: Dictionary<any>) {
  const api = await getApiClient();
  const customizationService = api.getResource<CustomizationService>('CustomizationService');

  customizationService.setTheme(config.nightMode ? 'night-theme' : 'day-theme');

  if (config.resolution) {
    t.context.app.browserWindow.setSize(config.resolution.width, config.resolution.height);
  }

  // volmeters needs some time to resize
  await sleep(1000);
}

async function getFocusedWindowId(t: TExecutionContext): Promise<string> {
  const url = await t.context.app.client.getUrl();
  return url.match(/windowId=main$/) ? 'main' : 'child';
}

export async function makeScreenshots(t: TExecutionContext, title = '') {
  const api = await getApiClient();
  const performanceService = api.getResource<PerformanceService>('PerformanceService');
  const audioService = api.getResource<IAudioServiceApi>('AudioService');
  const windowService = api.getResource<WindowsService>('WindowsService');

  // tune services to have the same screenshots in any environment
  // PerformanceService causes different cpu usage
  performanceService.stop();
  // AudioSources causes a different volmeter level
  audioService.getSources().forEach(audioSource => audioSource.setMuted(true));
  // main window title may contain different project version
  windowService.updateMainWindowOptions({ title: 'Streamlabs Desktop - screentest' });

  const windowId = await getFocusedWindowId(t);

  configs = getConfigsVariations();
  const processedConfigs: string[] = [];

  for (let configInd = 0; configInd < configs.length; configInd++) {
    const config = configs[configInd];

    for (const paramName in config) {
      if (CONFIG.configs[paramName].window && CONFIG.configs[paramName].window !== windowId) {
        delete config[paramName];
      }
    }

    const configStr = JSON.stringify(config);
    if (processedConfigs.includes(configStr)) continue;
    processedConfigs.push(configStr);

    await applyConfig(t, config);
    await t.context.app.browserWindow.capturePage().then((imageBuffer: NativeImage) => {
      const testName = t.title.replace('afterEach hook for ', '');
      const screenshotName = title ? `${testName}_${title}` : testName;
      const imageFileName = `${screenshotName}__${configInd}.png`;
      fs.writeFileSync(`${CONFIG.dist}/${branchName}/${imageFileName}`, imageBuffer);
    });
    screenshotsCaptured = true;
  }
}

export function runScreentest() {
  // detect current branch name
  const currentBranchFile = `${CONFIG.dist}/current-branch.txt`;
  if (fs.existsSync(currentBranchFile)) {
    branchName = fs.readFileSync(currentBranchFile).toString();
  } else {
    branchName = CONFIG.baseBranch;
  }

  // create dirs for screenshots
  if (!fs.existsSync(CONFIG.dist)) fs.mkdirSync(CONFIG.dist);
  if (!fs.existsSync(`${CONFIG.dist}/${branchName}`)) fs.mkdirSync(`${CONFIG.dist}/${branchName}/`);

  test.beforeEach(async t => {
    screenshotsCaptured = false;
  });

  test.afterEach(async (t: TExecutionContext) => {
    // if no screenshots have been captured wile test running
    // make screenshots before finishing the test
    if (!screenshotsCaptured) await makeScreenshots(t);
  });

  afterAppStart(async t => {
    // Disable blinking of the caret in the text inputs
    const disableCaretCode = `
      const disableCaretEl = document.createElement('style');
      disableCaretEl.textContent =
        'input, textarea { caret-color: transparent; }';
      document.head.appendChild(disableCaretEl);
    `;
    await t.context.app.webContents.executeJavaScript(disableCaretCode);
    await focusChild();
    await t.context.app.webContents.executeJavaScript(disableCaretCode);
    await focusMain();
  });
}

export async function disableGifAnimations(t: TExecutionContext) {
  // there are no way to stop gif animations
  // so just make them transparent
  await t.context.app.webContents.executeJavaScript(`
    const styleEl = document.createElement('style');
    styleEl.textContent =
      'img[src$=".gif"] { opacity: 0 }';
    document.head.appendChild(styleEl);
  `);
}
