import { useWebdriver, test, skipCheckingErrorsInLog } from '../helpers/webdriver/index.mjs';
import { getApiClient } from '../helpers/api-client.js';
import { PerformanceService } from 'app-services.js';
import { click, focusChild, waitForDisplayed, waitForText } from '../helpers/modules/core.mjs';

useWebdriver();

test('Receiving notifications', async t => {
  const client = await getApiClient();
  const performanceMonitor = client.getResource<PerformanceService>('PerformanceService');

  // TODO: fix React warnings in the console
  await skipCheckingErrorsInLog();

  await click('.metrics-icon');
  await focusChild();
  await waitForDisplayed("div=You don't have any notifications");

  performanceMonitor.pushLaggedFramesNotify(0.5);

  await waitForDisplayed('div[data-name=notification]');
  t.pass();
});

test('Clicking notifications', async t => {
  const client = await getApiClient();
  const performanceMonitor = client.getResource<PerformanceService>('PerformanceService');

  // TODO: fix React warnings in the console
  await skipCheckingErrorsInLog();

  performanceMonitor.pushLaggedFramesNotify(0.5);

  await click('.footer .fa-exclamation-triangle');
  await focusChild();
  await click('[data-name=hasAction]');

  await waitForDisplayed('h4=What does this mean?');
  t.pass();
});
