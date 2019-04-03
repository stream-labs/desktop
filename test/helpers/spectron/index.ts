/// <reference path="../../../app/index.d.ts" />
import avaTest, { ExecutionContext, TestInterface } from 'ava';
import { Application } from 'spectron';
import { getClient } from '../api-client';
import { DismissablesService } from 'services/dismissables';
import { getUserName, releaseUserInPool } from './user';
import { sleep } from '../sleep';

export const test = avaTest as TestInterface<ITestContext>;

const path = require('path');
const fs = require('fs');
const os = require('os');
const rimraf = require('rimraf');

const ALMOST_INFINITY = Math.pow(2, 31) - 1; // max 32bit int

async function focusWindow(t: any, regex: RegExp) {
  const handles = await t.context.app.client.windowHandles();

  for (const handle of handles.value) {
    await t.context.app.client.window(handle);
    const url = await t.context.app.client.getUrl();
    if (url.match(regex)) return;
  }
}

// Focuses the main window
export async function focusMain(t: any) {
  await focusWindow(t, /windowId=main$/);
}

// Focuses the child window
export async function focusChild(t: any) {
  await focusWindow(t, /windowId=child/);
}

// Focuses the Library webview
export async function focusLibrary(t: any) {
  // doesn't work without delay, probably need to wait until load
  await sleep(2000);
  await focusWindow(t, /streamlabs\.com\/library/);
}

// Close current focused window
export async function closeWindow(t: any) {
  await t.context.app.browserWindow.close();
}

interface ITestRunnerOptions {
  skipOnboarding?: boolean;
  restartAppAfterEachTest?: boolean;
  pauseIfFailed?: boolean;
  appArgs?: string;
  afterStartCb?(t: any): Promise<any>;

  /**
   * Enable this to show network logs if test failed
   */
  networkLogging?: boolean;

  /**
   * Called after cache directory is created but before
   * the app is started.  This is useful for setting up
   * some known state in the cache directory before the
   * app starts up and loads it.
   */
  beforeAppStartCb?(t: any): Promise<any>;
}

const DEFAULT_OPTIONS: ITestRunnerOptions = {
  skipOnboarding: true,
  restartAppAfterEachTest: true,
  networkLogging: false,
  pauseIfFailed: false,
};

export interface ITestContext {
  cacheDir: string;
  app: Application;
}

export type TExecutionContext = ExecutionContext<ITestContext>;

export function useSpectron(options: ITestRunnerOptions = {}) {
  // tslint:disable-next-line:no-parameter-reassignment TODO
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  let appIsRunning = false;
  let context: any = null;
  let app: any;
  let testPassed = false;
  let failMsg = '';
  let testName = '';
  let logFileLastReadingPos = 0;
  const failedTests: string[] = [];
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'slobs-test'));

  async function startApp(t: TExecutionContext) {
    t.context.cacheDir = cacheDir;
    const appArgs = options.appArgs ? options.appArgs.split(' ') : [];
    if (options.networkLogging) appArgs.push('--network-logging');
    app = t.context.app = new Application({
      path: path.join(__dirname, '..', '..', '..', '..', 'node_modules', '.bin', 'electron.cmd'),
      args: [
        '--require',
        path.join(__dirname, 'context-menu-injected.js'),
        '--require',
        path.join(__dirname, 'dialog-injected.js'),
        ...appArgs,
        '.',
      ],
      env: {
        NODE_ENV: 'test',
        SLOBS_CACHE_DIR: t.context.cacheDir,
      },
      webdriverOptions: {
        // most of deprecation warning encourage us to use WebdriverIO actions API
        // however the documentation for this API looks very poor, it provides only one example:
        // http://webdriver.io/api/protocol/actions.html
        // disable deprecation warning and waiting for better docs now
        deprecationWarnings: false,
      },
    });

    if (options.beforeAppStartCb) await options.beforeAppStartCb(t);

    await t.context.app.start();

    // Disable CSS transitions while running tests to allow for eager test clicks
    await t.context.app.webContents.executeJavaScript(`
      const disableAnimationsEl = document.createElement('style');
      disableAnimationsEl.textContent =
        '*{ transition: none !important; transition-property: none !important; }';
      document.head.appendChild(disableAnimationsEl);
    `);

    // Wait up to 2 seconds before giving up looking for an element.
    // This will slightly slow down negative assertions, but makes
    // the tests much more stable, especially on slow systems.
    t.context.app.client.timeouts('implicit', 2000);

    // await sleep(10000);

    // Pretty much all tests except for onboarding-specific
    // tests will want to skip this flow, so we do it automatically.
    if (options.skipOnboarding) {
      await focusMain(t);
      await t.context.app.client.click('a=Setup later');

      // This will only show up if OBS is installed
      if (await t.context.app.client.isExisting('button=Start Fresh')) {
        await t.context.app.client.click('button=Start Fresh');
      }
    } else {
      // Wait for the connect screen before moving on
      await t.context.app.client.isExisting('button=Twitch');
    }

    // disable the popups that prevents context menu to be shown
    const client = await getClient();
    const dismissablesService = client.getResource<DismissablesService>('DismissablesService');
    dismissablesService.dismissAll();

    context = t.context;
    appIsRunning = true;

    if (options.afterStartCb) {
      await options.afterStartCb(t);
    }
  }

  async function stopApp(t: TExecutionContext) {
    try {
      await context.app.stop();
    } catch (e) {
      fail('Crash on shutdown');
    }
    appIsRunning = false;
    await checkErrorsInLogFile();
    logFileLastReadingPos = 0;
    await new Promise(resolve => {
      rimraf(context.cacheDir, resolve);
    });
  }

  /**
   * test should be considered as failed if it writes exceptions in to the log file
   */
  async function checkErrorsInLogFile() {
    const filePath = path.join(cacheDir, 'slobs-client', 'log.log');
    if (!fs.existsSync(filePath)) return;
    const logs = fs.readFileSync(filePath).toString();
    const errors = logs
      .substr(logFileLastReadingPos)
      .split('\n')
      .filter((record: string) => record.match(/\[error\]/));

    // save the last reading position, to skip already read records next time
    logFileLastReadingPos = logs.length - 1;

    if (errors.length) {
      fail(`The log-file has errors \n ${logs}`);
    } else if (options.networkLogging && !testPassed) {
      fail(`log-file: \n ${logs}`);
    }
  }

  test.beforeEach(async t => {
    testName = t.title.replace('beforeEach hook for ', '');
    testPassed = false;
    t.context.app = app;
    if (options.restartAppAfterEachTest || !appIsRunning) await startApp(t);
  });

  test.afterEach(async t => {
    testPassed = true;
  });

  test.afterEach.always(async t => {
    await checkErrorsInLogFile();
    if (!testPassed && options.pauseIfFailed) {
      console.log('Test execution has been paused due `pauseIfFailed` enabled');
      await sleep(ALMOST_INFINITY);
    }

    // wrap in try/catch for the situation when we have a crash
    // so we still can read the logs after the crash
    try {
      const client = await getClient();
      await client.unsubscribeAll();
      await releaseUserInPool();
      if (options.restartAppAfterEachTest) {
        client.disconnect();
        await stopApp(t);
      }
    } catch (e) {
      testPassed = false;
    }

    if (!testPassed) {
      failedTests.push(testName);
      const userName = getUserName();
      if (userName) console.log(`Test failed for the account: ${userName}`);
      t.fail(failMsg);
    }
  });

  test.after.always(async t => {
    if (appIsRunning) {
      await stopApp(t);
      if (!testPassed) failedTests.push(testName);
    }

    if (failedTests.length) saveFailedTestsToFile(failedTests);
  });

  function fail(msg: string) {
    testPassed = false;
    failMsg = msg;
  }
}

function saveFailedTestsToFile(failedTests: string[]) {
  const filePath = 'test-dist/failed-tests.json';
  if (fs.existsSync(filePath)) {
    // tslint:disable-next-line:no-parameter-reassignment TODO
    failedTests = JSON.parse(fs.readFileSync(filePath)).concat(failedTests);
  }
  fs.writeFileSync(filePath, JSON.stringify(failedTests));
}
