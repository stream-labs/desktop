import { useSpectron, test, focusChild } from '../helpers/spectron';
import { getClient } from '../helpers/api-client';
import { PerformanceService } from 'app-services';

useSpectron();

test('Troubleshooter notifications', async t => {
  const app = t.context.app;
  const client = await getClient();
  const performanceMonitor = client.getResource<PerformanceService>('PerformanceService');

  await (await t.context.app.client.$('.metrics-icon')).click();
  await focusChild(t);

  t.false(await (await app.client.$('div[name=notification]')).isExisting());

  performanceMonitor.pushLaggedFramesNotify(0.5);

  t.true(await (await app.client.$('div[name=notification]')).isExisting());
});
