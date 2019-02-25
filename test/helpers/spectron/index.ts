/// <reference path="../../../app/index.d.ts" />
import avaTest, { ExecutionContext, TestInterface } from 'ava';
import { Application } from 'spectron';
import { getClient } from '../api-client';
import { DismissablesService } from 'services/dismissables';

export const test = avaTest as TestInterface<ITestContext>;

const path = require('path');
const fs = require('fs');
const os = require('os');
const rimraf = require('rimraf');

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

interface ITestRunnerOptions {
  skipOnboarding?: boolean;
  restartAppAfterEachTest?: boolean;
  appArgs?: string;
  afterStartCb?(t: any): Promise<any>;

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
  let testName = '';
  const failedTests: string[] = [];
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'slobs-test'));

  async function startApp(t: TExecutionContext) {
    t.context.cacheDir = cacheDir;
    app = t.context.app = new Application({
      path: path.join(__dirname, '..', '..', '..', '..', 'node_modules', '.bin', 'electron.cmd'),
      args: [
        '--require',
        path.join(__dirname, 'context-menu-injected.js'),
        '--require',
        path.join(__dirname, 'dialog-injected.js'),
        options.appArgs ? options.appArgs : '',
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

    // Wait up to 2 seconds before giving up looking for an element.
    // This will slightly slow down negative assertions, but makes
    // the tests much more stable, especially on slow systems.
    t.context.app.client.timeouts('implicit', 2000);

    // await sleep(100000);

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

  async function stopApp() {
    try {
      await context.app.stop();
      await new Promise(resolve => {
        rimraf(context.cacheDir, resolve);
      });
    } catch (e) {
      // TODO: find the reason why some tests are failing here
      testPassed = false;
    }
    appIsRunning = false;
  }

  /**
   * test should be considered as failed if it writes exceptions in to the log file
   */
  async function checkErrorsInLogFile(t: TExecutionContext) {
    const filePath = path.join(cacheDir, 'slobs-client', 'log.log');
    if (!fs.existsSync(filePath)) return;
    const logs = fs.readFileSync(filePath).toString();
    const errors = logs
      .split('\n')
      .filter((record: string) => record.match(/\[error\]/));
    fs.unlinkSync(filePath);
    if (!errors.length) return;
    t.fail();
    testPassed = false;
    console.log('The log-file has errors');
    console.log(logs);
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
    // wrap in try/catch for the situation when we have a crash
    // so we still can read the logs after the crash
    try {
      const client = await getClient();
      await client.unsubscribeAll();
      if (options.restartAppAfterEachTest) {
        client.disconnect();
        await stopApp();
      }
    } catch (e) {
      testPassed = false;
    }

    await checkErrorsInLogFile(t);
    if (!testPassed) failedTests.push(testName);
  });

  test.after.always(async t => {
    if (appIsRunning) {
      await stopApp();
      if (!testPassed) failedTests.push(testName);
    }

    if (failedTests.length) saveFailedTestsToFile(failedTests);
  });
}

function saveFailedTestsToFile(failedTests: string[]) {
  const filePath = 'test-dist/failed-tests.json';
  if (fs.existsSync(filePath)) {
    // tslint:disable-next-line:no-parameter-reassignment TODO
    failedTests = JSON.parse(fs.readFileSync(filePath)).concat(failedTests);
  }
  fs.writeFileSync(filePath, JSON.stringify(failedTests));
}
