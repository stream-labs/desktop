import { useSpectron, test, focusChild } from '../helpers/spectron';
import { getClient } from '../helpers/api-client';
import { PerformanceService } from 'app-services';

useSpectron();

test('Troubleshooter notifications', async t => {
  const app = t.context.app;
  const client = await getClient();
  const performanceMonitor = client.getResource<PerformanceService>('PerformanceService');

  await t.context.app.client.click('.metrics-icon');
  await focusChild(t);

  t.false(await app.client.isExisting('div[name=notification]'));

  performanceMonitor.pushLaggedFramesNotify(0.5);

  t.true(await app.client.isExisting('div[name=notification]'));
});
