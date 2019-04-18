import { TExecutionContext, test, useSpectron } from '../helpers/spectron/index';
import { addSource } from '../helpers/spectron/sources';
import { logIn } from '../helpers/spectron/user';
import { FormMonkey } from '../helpers/form-monkey';
import { waitForWidgetSettingsSync } from '../helpers/widget-helpers';
import { sleep } from '../helpers/sleep';

useSpectron({ appArgs: '--nosync' });

testGoal('Donation Goal');
testGoal('Follower Goal');
testGoal('Bit Goal');

function testGoal(goalType: string) {
  test(`${goalType} create and delete`, async t => {
    const client = t.context.app.client;
    if (!(await logIn(t))) return;
    await addSource(t, goalType, goalType, false);

    // end goal if it's already exist
    if (await client.isVisible('button=End Goal')) {
      await client.click('button=End Goal');
    }

    await client.waitForVisible('button=Start Goal');

    const formMonkey = new FormMonkey(t, 'form[name=new-goal-form]');
    await formMonkey.fill({
      title: 'My Goal',
      goal_amount: 100,
      manual_goal_amount: 0,
      ends_at: '12/12/2030',
    });
    await client.click('button=Start Goal');
    await client.waitForVisible('button=End Goal');
    t.true(await client.isExisting('span=My Goal'));
    await client.click('button=End Goal');
    await client.waitForVisible('button=Start Goal');
  });

  // TODO flaky test
  test(`${goalType} change settings`, async t => {
    const client = t.context.app.client;
    if (!(await logIn(t))) return;

    await addSource(t, goalType, goalType, false);

    await client.click('li=Visual Settings');
    const formMonkey = new FormMonkey(t, 'form[name=visual-properties-form]');

    const testSet1 = {
      layout: 'standard',
      background_color: '#FF0000',
      bar_color: '#FF0000',
      bar_bg_color: '#FF0000',
      text_color: '#FF0000',
      bar_text_color: '#FF0000',
      font: 'Roboto',
    };

    await formMonkey.fill(testSet1);
    await waitForWidgetSettingsSync(t, () => formMonkey.fill(testSet1));
    t.true(await formMonkey.includes(testSet1));

    const testSet2 = {
      layout: 'condensed',
      background_color: '#7ED321',
      bar_color: '#AB14CE',
      bar_bg_color: '#DDDDDD',
      text_color: '#FFFFFF',
      bar_text_color: '#F8E71C',
      font: 'Open Sans',
    };

    await waitForWidgetSettingsSync(t, () => formMonkey.fill(testSet2));
    t.true(await formMonkey.includes(testSet2));
  });
}
