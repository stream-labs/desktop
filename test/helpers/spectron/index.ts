/// <reference path="../../../app/index.d.ts" />
import 'rxjs/add/operator/first';
import test from 'ava';
import { Application } from 'spectron';
import { getClient } from '../api-client';
import { DismissablesService } from 'services/dismissables';
import { sleep } from '../sleep';

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
  restartAppAfterEachTest: true
};

export function useSpectron(options: ITestRunnerOptions = {}) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  let appIsRunning = false;
  let context: any = null;
  let app: any;
  let testPassed = false;

  async function startApp(t: any) {
    t.context.cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'slobs-test'));
    app = t.context.app = new Application({
      path: path.join(__dirname, '..', '..', '..', '..', 'node_modules', '.bin', 'electron.cmd'),
      args: [
        '--require',
        path.join(__dirname, 'context-menu-injected.js'),
        '--require',
        path.join(__dirname, 'dialog-injected.js'),
        options.appArgs ? options.appArgs : '',
        '.'
      ],
      env: {
        NODE_ENV: 'test',
        SLOBS_CACHE_DIR: t.context.cacheDir
      }
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
    await context.app.stop();
    await new Promise((resolve) => {
      rimraf(context.cacheDir, resolve);
    });
    appIsRunning = false;
  }

  test.beforeEach(async t => {
    console.log('test start');
    testPassed = false;
    t.context.app = app;
    if (options.restartAppAfterEachTest || !appIsRunning) await startApp(t);
  });

  test.afterEach(async t => {
    testPassed = true;
    console.log('test successfully finished');
  });

  test.afterEach.always(async t => {
    const testName = t.title.replace('afterEach for ', '');
    console.log('test finish', t.title);
    const client = await getClient();
    await client.unsubscribeAll();
    if (options.restartAppAfterEachTest) {
      client.disconnect();
    }

    if (options.restartAppAfterEachTest) {
      await stopApp();
    }
  });

  test.after.always(async t => {
    if (appIsRunning) await stopApp();
  });
}
