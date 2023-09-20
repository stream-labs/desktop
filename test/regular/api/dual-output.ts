import { DualOutputService } from 'services/dual-output';
import { getApiClient } from '../../helpers/api-client';
import { test, useWebdriver, TExecutionContext } from '../../helpers/webdriver';
import { AutoConfigService } from 'services/auto-config';
import { ScenesService } from 'services/scenes';
import { VideoSettingsService } from 'services/settings-v2/video';
import { logIn } from '../../helpers/modules/user';
import { SettingsService } from 'services/settings';

useWebdriver();

/**
 * Dual output video settings
 */
test.skip('Dual output display toggles filter source selector data', async (t: TExecutionContext) => {
  // @@@ TODO
  // build scene
  // toggle dual output
  // set active displays
  // check return value from scene getSourceSelectorNodes and compare to dual output node ids
  const client = await getApiClient();
  const dualOutputService = client.getResource<DualOutputService>('DualOutputService');
  const scenesService = client.getResource<ScenesService>('ScenesService');
  const horizontalNodeIds = dualOutputService.views.horizontalNodeIds;
  const verticalNodeIds = dualOutputService.views.verticalNodeIds;
});

/**
 * Dual output auto-config
 */
test('Auto config works with Dual Output Scene Collections', async (t: TExecutionContext) => {
  await logIn('twitch');

  const client = await getApiClient();
  const dualOutputService = client.getResource<DualOutputService>('DualOutputService');
  const videoSettingsService = client.getResource<VideoSettingsService>('VideoSettingsService');
  const autoConfigService = client.getResource<AutoConfigService>('AutoConfigService');
  const settingsService = client.getResource<SettingsService>('SettingsService');

  dualOutputService.setdualOutputMode(true);
  videoSettingsService.setVideoSetting('baseWidth', 852, 'horizontal');
  videoSettingsService.setVideoSetting('baseHeight', 480, 'horizontal');
  videoSettingsService.setVideoSetting('baseWidth', 720, 'vertical');
  videoSettingsService.setVideoSetting('baseHeight', 1280, 'vertical');

  await autoConfigService.start();

  // const horizontalBaseWidth = videoSettingsService.contexts.horizontal.video.baseWidth;
  // const verticalBaseHeight = videoSettingsService.contexts.vertical.video.baseHeight;

  const horizontalBaseWidthState = videoSettingsService.state.horizontal.baseWidth;
  const verticalBaseHeightState = videoSettingsService.state.vertical.baseHeight;

  const [baseWidth, baseHeight] = settingsService.views.values.Video.Base.split('x');
  const [outputWidth, outputHeight] = settingsService.views.values.Video.Output.split('x');

  // console.log('horizontalBaseWidth ', horizontalBaseWidth);
  // console.log('verticalBaseHeight ', verticalBaseHeight);
  console.log('horizontalBaseWidthState ', horizontalBaseWidthState);
  console.log('verticalBaseHeightState ', verticalBaseHeightState);
  console.log('baseWidth ', baseWidth);
  console.log('baseHeight ', baseHeight);
  // t.deepEqual(horizontalBaseWidth, 1920);
  // t.deepEqual(verticalBaseHeight, 1080);
});
