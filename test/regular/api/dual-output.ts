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
