import { useSpectron, test, focusChild } from '../helpers/spectron';
import { getClient } from '../helpers/api-client';
import { PerformanceService } from 'app-services';

useSpectron();

test('Receiving notifications', async t => {
  const app = t.context.app;
  const client = await getClient();
  const performanceMonitor = client.getResource<PerformanceService>('PerformanceService');

  await (await t.context.app.client.$('.metrics-icon')).click();
  await focusChild(t);

  t.false(await (await app.client.$('div[data-name=notification]')).isExisting());

  performanceMonitor.pushLaggedFramesNotify(0.5);

  t.true(await (await app.client.$('div[data-name=notification]')).isExisting());
});

test('Clicking notifications', async t => {
  const app = t.context.app;
  const client = await getClient();
  const performanceMonitor = client.getResource<PerformanceService>('PerformanceService');

  performanceMonitor.pushLaggedFramesNotify(0.5);

  await (await app.client.$('.fa-exclamation-triangle')).click();
  await focusChild(t);

  await (await app.client.$('.has-action')).click();

  t.true(await (await app.client.$('h4=What does this mean?')).isExisting());
})
