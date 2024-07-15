import { DualOutputService } from 'services/dual-output';
import { getApiClient } from '../../helpers/api-client';
import { test, useWebdriver, TExecutionContext } from '../../helpers/webdriver';
import { ScenesService } from 'services/scenes';
import { VideoSettingsService } from 'services/settings-v2/video';

useWebdriver();

test('Convert single output collection to dual output', async (t: TExecutionContext) => {
  const client = await getApiClient();
  const scenesService = client.getResource<ScenesService>('ScenesService');
  const videoSettingsService = client.getResource<VideoSettingsService>('VideoSettingsService');
  const dualOutputService = client.getResource<DualOutputService>('DualOutputService');
  const scene = scenesService.createScene('Scene1');
  scene.createAndAddSource('Item1', 'color_source');
  scene.createAndAddSource('Item2', 'color_source');
  scene.createAndAddSource('Item3', 'color_source');

  // single output
  const horizontalContext = videoSettingsService.contexts.horizontal;
  scene.getItems().forEach(sceneItem => {
    t.is(sceneItem?.display, 'horizontal');
    t.deepEqual(sceneItem?.output, horizontalContext);
  });
  const singleOutputLength = scene.getItems().length;

  dualOutputService.collectionHandled.subscribe(() => void 0);

  // dual output
  dualOutputService.convertSingleOutputToDualOutputCollection();

  const sceneNodeMaps = (await client.fetchNextEvent()).data;
  t.not(sceneNodeMaps, null);

  const nodeMap = sceneNodeMaps[scene.id];
  const verticalContext = videoSettingsService.contexts.vertical;

  scene.getItems().forEach(sceneItem => {
    const item = {
      id: sceneItem.id,
      sourceId: sceneItem.sourceId,
      display: sceneItem.display,
    };

    // confirm source and entry in node map
    if (sceneItem?.display === 'horizontal') {
      const verticalItem = scene.getItem(nodeMap[sceneItem.id]);
      t.is(verticalItem?.display, 'vertical');
      t.is(verticalItem?.sourceId, sceneItem.sourceId);
    }

    // confirm video context
    const context = sceneItem?.display === 'vertical' ? verticalContext : horizontalContext;
    t.deepEqual(sceneItem?.output, context);
  });

  const dualOutputLength = scene.getItems().length;

  // confirm dual output collection length is double the single output collection length
  t.is(singleOutputLength * 2, dualOutputLength);
});
