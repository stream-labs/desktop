import { DualOutputService } from 'services/dual-output/index.js';
import { getApiClient } from '../../helpers/api-client.js';
import { test, TExecutionContext, useWebdriver } from '../../helpers/webdriver/index.mjs';
import { ScenesService } from 'services/scenes/index.js';

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
