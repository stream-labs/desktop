import { TExecutionContext, test, useSpectron, closeWindow } from '../../../helpers/spectron/index';
import { logIn, logOut } from '../../../helpers/spectron/user';
import { makeScreenshots, useScreentest } from '../../screenshoter';
import { FormMonkey } from '../../../helpers/form-monkey';
import { addWidget, EWidgetType, waitForWidgetSettingsSync } from '../../../helpers/widget-helpers';
import moment = require('moment');

useSpectron({ appArgs: '--nosync', restartAppAfterEachTest: false });
useScreentest();

testGoal('Donation Goal', EWidgetType.DonationGoal);
testGoal('Follower Goal', EWidgetType.FollowerGoal);
testGoal('Bit Goal', EWidgetType.BitGoal);

function testGoal(goalType: string, widgetType: EWidgetType) {
  test(`${goalType} create and delete`, async (t: TExecutionContext) => {
    await logIn(t);
    const client = t.context.app.client;
    await addWidget(t, widgetType, goalType);

    // end goal if it's already exist
    if (await client.isVisible('button=End Goal')) {
      await client.click('button=End Goal');
    }

    await client.waitForVisible('button=Start Goal', 20000);

    await makeScreenshots(t, 'Empty Form');

    const formMonkey = new FormMonkey(t, 'form[name=new-goal-form]');
    await formMonkey.fill({
      title: 'My Goal',
      goal_amount: 100,
      manual_goal_amount: 0,
      ends_at: '12/12/2030',
    });

    // because of a different latency of api.streamlabs.com
    // we may see a different date after goal creation
    // for example `1 day` or `23 hours`
    // just disable displaying ends_at field to make screenshots consistent
    await t.context.app.webContents.executeJavaScript(`
      $('.goal-row:nth-child(4) span:nth-child(2)').innerText = '2 days to go';
    `);

    await makeScreenshots(t, 'Filled Form');

    await client.click('button=Start Goal');
    await client.waitForVisible('button=End Goal');
    t.true(await client.isExisting('span=My Goal'));

    await makeScreenshots(t, 'Created Goal');
    await closeWindow(t);
    await logOut(t);
  });

  test(`${goalType} settings`, async t => {
    await logIn(t);
    const client = t.context.app.client;
    await addWidget(t, widgetType, goalType);

    await client.waitForExist('li=Visual Settings');
    await client.click('li=Visual Settings');

    const formMonkey = new FormMonkey(t, 'form[name=visual-properties-form]');

    const testSet = {
      layout: 'standard',
      background_color: '#FF0000',
      bar_color: '#FF0000',
      bar_bg_color: '#FF0000',
      text_color: '#FF0000',
      bar_text_color: '#FF0000',
      font: 'Roboto',
    };
    await formMonkey.fill(testSet);
    await waitForWidgetSettingsSync(t);

    await makeScreenshots(t, 'Settings');

    await closeWindow(t);
    await logOut(t);
    t.pass();
  });
}
