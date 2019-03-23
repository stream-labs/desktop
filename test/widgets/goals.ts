import { TExecutionContext, test, useSpectron } from '../helpers/spectron/index';
import { addSource } from '../helpers/spectron/sources';
import { logIn } from '../helpers/spectron/user';
import { FormMonkey } from '../helpers/form-monkey';
import { waitForWidgetSettingsSync } from '../helpers/widget-helpers';
import { sleep } from '../helpers/sleep';

useSpectron({ appArgs: '--nosync', logNetwork: true });

async function testGoal(t: TExecutionContext, goalType: string) {
  const client = t.context.app.client;
  if (!(
    await logIn(t)
  )) {
    return;
  }
  await addSource(t, goalType, goalType, false);

  await client.click('li=Visual Settings');
  const formName = 'visual-properties-form';

  const formMonkey = new FormMonkey(t);

  const testSet1 = {
    layout: 'standard',
    background_color: '#FF0000',
    bar_color: '#FF0000',
    bar_bg_color: '#FF0000',
    text_color: '#FF0000',
    bar_text_color: '#FF0000',
    font: 'Roboto'
  };

  await formMonkey.fill(formName, testSet1);
  await waitForWidgetSettingsSync(t);
  t.true(await formMonkey.includes(formName, testSet1));

  const testSet2 = {
    layout: 'condensed',
    background_color: '#7ED321',
    bar_color: '#AB14CE',
    bar_bg_color: '#DDDDDD',
    text_color: '#FFFFFF',
    bar_text_color: '#F8E71C',
    font: 'Open Sans'
  };

  await formMonkey.fill(formName, testSet2);
  await waitForWidgetSettingsSync(t);
  t.true(await formMonkey.includes(formName, testSet1));
}

// TODO: Test is flaky
test.skip('Donation Goal', async t => {
  await testGoal(t, 'Donation Goal');
});

// TODO: Test is flaky
test.skip('Follower Goal', async t => {
  await testGoal(t, 'Follower Goal');
});

// TODO: Test is flaky
test.skip('Bit Goal', async t => {
  await testGoal(t, 'Bit Goal');
});

for (let i = 1; i <= 50; i++) {
  const testName = ['Donation Goal', 'Follower Goal', 'Bit Goal'][i % 3];
  test(`${testName} ${i}`, async t => {
    await testGoal(t, testName);
  });
}
