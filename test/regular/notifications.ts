import { useSpectron, test, skipCheckingErrorsInLog } from '../helpers/spectron';
import { getApiClient } from '../helpers/api-client';
import { PerformanceService } from 'app-services';
import { click, focusChild, waitForDisplayed, waitForText } from '../helpers/modules/core';

useSpectron();

test('Receiving notifications', async t => {
  const client = await getApiClient();
  const performanceMonitor = client.getResource<PerformanceService>('PerformanceService');

  // TODO: fix React warnings in the console
  await skipCheckingErrorsInLog();

  await click('.metrics-icon');
  await focusChild();
  await waitForDisplayed('div=You do not have any notifications');

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

  await click('.fa-exclamation-triangle');
  await focusChild();
  await click('.has-action');

  await waitForDisplayed('h4=What does this mean?');
  t.pass();
});
