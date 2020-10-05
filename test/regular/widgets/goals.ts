import { TExecutionContext, test, useSpectron } from '../../helpers/spectron';
import { addSource } from '../../helpers/spectron/sources';
import { logIn } from '../../helpers/spectron/user';
import { FormMonkey } from '../../helpers/form-monkey';
import { waitForWidgetSettingsSync } from '../../helpers/widget-helpers';
import { sleep } from '../../helpers/sleep';

useSpectron({ pauseIfFailed: true });

for (let i = 0; i < 50; i++) {
  testGoal('Donation Goal', i);
  testGoal('Follower Goal', i);
  testGoal('Bit Goal', i);
}

async function toggleGoal(t: TExecutionContext, enabled: boolean) {
  const currentButtonSelector = enabled ? 'button=End Goal' : 'button=Start Goal';
  const waitingButtonSelector = enabled ? 'button=Start Goal' : 'button=End Goal';
  await t.context.app.client.click(currentButtonSelector);
  await sleep(1000);
  try {
    t.context.app.client.waitForVisible(waitingButtonSelector);
    return;
  } catch (e) {
    console.error(`The goal widget has not switched the state to ${enabled}, retrying`);
    await t.context.app.client.click(currentButtonSelector);
    await sleep(1000);
    t.context.app.client.waitForVisible(waitingButtonSelector);
  }
}

function testGoal(goalType: string, ind: number) {
  test(`${goalType} create and delete ${ind}`, async t => {
    const client = t.context.app.client;
    if (!(await logIn(t))) return;
    await addSource(t, goalType, goalType, false);

    // end goal if it's already exist
    if (await client.isVisible('button=End Goal')) {
      await toggleGoal(t, false);
    }

    // console.log('wait for visible 1 button=Start Goal');
    // await waitForWidgetSettingsSync(t);
    // await client.waitForVisible('button=Start Goal', 20000);

    const formMonkey = new FormMonkey(t, 'form[name=new-goal-form]');
    await formMonkey.fill({
      title: 'My Goal',
      goal_amount: 100,
      manual_goal_amount: 0,
      ends_at: '12/12/2030',
    });

    await toggleGoal(t, true);
    // await client.click('button=Start Goal');
    // await waitForWidgetSettingsSync(t);
    // await client.waitForVisible('button=End Goal');

    t.true(await client.isExisting('span=My Goal'));
    await toggleGoal(t, false);
    // await client.click('button=End Goal');
    //
    // console.log('wait for visible 2 button=Start Goal');
    // await waitForWidgetSettingsSync(t);
    // await client.waitForVisible('button=Start Goal', 20000);
    console.log('finish');
  });

  // test(`${goalType} change settings`, async t => {
  //   const client = t.context.app.client;
  //   if (!(await logIn(t))) return;
  //
  //   await addSource(t, goalType, goalType, false);
  //
  //   await client.waitForExist('li=Visual Settings');
  //   await client.click('li=Visual Settings');
  //   const formMonkey = new FormMonkey(t, 'form[name=visual-properties-form]');
  //
  //   const testSet1 = {
  //     layout: 'standard',
  //     background_color: '#FF0000',
  //     bar_color: '#FF0000',
  //     bar_bg_color: '#FF0000',
  //     text_color: '#FF0000',
  //     bar_text_color: '#FF0000',
  //     font: 'Roboto',
  //   };
  //
  //   await formMonkey.fill(testSet1);
  //   await waitForWidgetSettingsSync(t);
  //   t.true(await formMonkey.includes(testSet1));
  //
  //   const testSet2 = {
  //     layout: 'condensed',
  //     background_color: '#7ED321',
  //     bar_color: '#AB14CE',
  //     bar_bg_color: '#DDDDDD',
  //     text_color: '#FFFFFF',
  //     bar_text_color: '#F8E71C',
  //     font: 'Open Sans',
  //   };
  //
  //   await formMonkey.fill(testSet2);
  //   await waitForWidgetSettingsSync(t);
  //   t.true(await formMonkey.includes(testSet2));
  // });
}
