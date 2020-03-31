import { MetricsService } from '../../../app/services/metrics';

console.log('include startup');
import { useSpectron, test, stopApp, startApp, TExecutionContext } from '../../helpers/spectron';
import { ApiClient, getClient } from '../../helpers/api-client';
import { ISourcesServiceApi, TSourceType } from '../../../app/services/sources/sources-api';
import { ScenesService } from '../../../app/services/api/external-api/scenes';
import { getMeter } from '../meter';
import { spawnSync } from 'child_process';
import { sleep } from '../../helpers/sleep';
import { PerformanceService } from '../../../app/app-services';
import { setOutputResolution, setTemporaryRecordingPath } from '../../helpers/spectron/output';
import { startRecording } from '../../helpers/spectron/streaming';
import { getCPUUsage, getMemoryUsage, usePerformanceTest } from '../tools';
const fs = require('fs-extra');
const _7z = require('7zip')['7z'];
const path = require('path');

usePerformanceTest();

const RELOAD_ATTEMPTS = 2;
const CPU_ATTEMPTS = 10;

/**
 * unzip a sample of a large scene collection to the SceneCollection folder
 */
function unzipLargeSceneCollection(t: TExecutionContext) {
  const cacheDir = t.context.cacheDir;
  const sceneCollectionPath = path.resolve(cacheDir, 'SceneCollections');
  fs.removeSync(sceneCollectionPath);

  const dataDir = path.resolve(__dirname, '..', '..', '..', '..', 'test', 'data');
  const sceneCollectionZip = path.resolve(
    dataDir,
    'scene-collections',
    'huge-scene-collection.zip',
  );
  spawnSync(_7z, ['x', sceneCollectionZip, `-o${cacheDir}`]);
}

function measureStartupTime(api: ApiClient) {
  const meter = getMeter();
  const metricsService = api.getResource<MetricsService>('MetricsService');
  const appMetrics = metricsService.getMetrics();
  meter.addMeasurement('mainWindowLoad', appMetrics.mainWindowShowTime - appMetrics.appStartTime);
  meter.addMeasurement(
    'sceneCollectionLoad',
    appMetrics.sceneCollectionLoadingTime - appMetrics.mainWindowShowTime,
  );
}

async function measureMemoryAndCPU(attempts = CPU_ATTEMPTS) {
  const meter = getMeter();
  while (attempts--) {
    meter.addMeasurement('CPU', await getCPUUsage());
    meter.addMeasurement('memory', await getMemoryUsage());
    await sleep(2000);
  }
}

test('Empty collection', async t => {
  const meter = getMeter();
  await stopApp(t);

  // measure startup time
  let attempts = RELOAD_ATTEMPTS;
  while (attempts--) {
    await startApp(t);
    const api = await getClient();
    measureStartupTime(api);
    await stopApp(t);
  }

  // measure the bundle size
  const bundlePath = path.resolve(__dirname, '..', '..', '..', '..', 'bundles', 'renderer.js');
  const bundleSize = fs.statSync(bundlePath).size;
  meter.addMeasurement('bundleSize', bundleSize);

  meter.printResults();
  t.pass();
});

test('Large collection', async t => {
  // extract large scene-collection
  await stopApp(t, false);
  await unzipLargeSceneCollection(t);
  const meter = getMeter();

  // measure startup time
  let i = 2;
  while (i--) {
    await startApp(t);
    const api = await getClient();
    measureStartupTime(api);
    await stopApp(t);
  }

  // measure memory and CPU
  await startApp(t);
  await measureMemoryAndCPU();

  meter.printResults();
  t.pass();
});

test('Recording', async t => {
  await setTemporaryRecordingPath(t);
  await setOutputResolution(t, '100x100');
  const api = await getClient();
  const scenesService = api.getResource<ScenesService>('ScenesService');
  const meter = getMeter();
  scenesService.activeScene.createAndAddSource('Color', 'color_source');

  await startRecording(t);
  await measureMemoryAndCPU();
  await startRecording(t);

  meter.printResults();
  t.pass();
});

test('Add and remove sources', async t => {
  const api = await getClient();
  const scenesService = api.getResource<ScenesService>('ScenesService');
  const meter = getMeter();
  scenesService.activeScene.createAndAddSource('Color', 'color_source');

  const sourceTypes = [
    'Video Capture Device',
    'Audio Output Capture',
    'Audio Input Capture',
    'Game Capture',
    'Window Capture',
    'Display Capture',
    'Image',
    'Image Slide Show',
    'Media Source',
    'Text (GDI+)',
    'Color Source',
    'Browser Source',
  ];

  // create and delete 10 instances for each source type 3 times
  let attempts = 3;
  while (attempts--) {
    meter.startMeasure('addSources');
    let sourcesCount = 10;
    while (sourcesCount--) {
      sourceTypes.forEach(type => {
        scenesService.activeScene.createAndAddSource(type, type as TSourceType);
      });
    }
    meter.stopMeasure('addSources');

    meter.startMeasure('removeSources');
    scenesService.activeScene.getNodes().forEach(node => {
      node.remove();
    });
    meter.stopMeasure('removeSources');

    // give some time to unfreeze UI
    await sleep(2000);
  }

  meter.printResults();
  t.pass();
});
