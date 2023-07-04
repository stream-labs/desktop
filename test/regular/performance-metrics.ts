import { useWebdriver, test } from '../helpers/webdriver';
import { click, focusChild, select, waitForDisplayed } from '../helpers/modules/core';

useWebdriver();

test('Performance metrics', async t => {
  await click('.metrics-icon');
  await focusChild();
  await waitForDisplayed('h2=Live Stats');
  const $cpu = await select('[role=metric-cpu]');
  const cpuUsage = parseFloat(await $cpu.getText());
  t.true(cpuUsage > 0, 'CPU usage should be greater than 0');
});
