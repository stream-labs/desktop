import { useWebdriver, test } from '../../helpers/webdriver';
import { getApiClient } from '../../helpers/api-client';
// import { EGameOverlayState, GameOverlayService } from 'services/api/external-api/game-overlay';

/* FIXME: I can't import services/api/external-api/game-overlay
// eslint-disable-next-line react-hooks/rules-of-hooks
useWebdriver({ restartAppAfterEachTest: false, skipOnboarding: true });

test('GameOverlay events', async t => {
  const client = await getApiClient();
  const gameOverlayService = client.getResource<GameOverlayService>('GameOverlayService');

  gameOverlayService.overlayStatusChanged.subscribe();
  const event = await client.fetchNextEvent();

  gameOverlayService.enable();

  await client.fetchNextEvent();

  // t.is(event.data, EGameOverlayState.Enabled);

  gameOverlayService.disable();

  await client.fetchNextEvent();

  t.is(event.data, EGameOverlayState.Disabled);
});

*/
