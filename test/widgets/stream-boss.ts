import { test, useSpectron } from '../helpers/spectron/index';
import { addSource } from '../helpers/spectron/sources';
import { logIn } from '../helpers/spectron/user';
import { FormMonkey } from '../helpers/form-monkey';
import { waitForWidgetSettingsSync } from '../helpers/widget-helpers';

useSpectron({ appArgs: '--nosync' });

// TODO flaky
test('Set stream-boss health', async t => {
  if (!(await logIn(t))) return;

  const client = t.context.app.client;
  await addSource(t, 'Stream Boss', '__Stream Boss', false);

  const setButtonSelector = 'button=Set Stream Boss Health';
  const resetButtonSelector = 'button=Reset Stream Boss';

  if (await client.isVisible(resetButtonSelector)) {
    await client.click(resetButtonSelector);
  }

  await client.waitForVisible(setButtonSelector);
  await client.click(setButtonSelector);
  await client.waitForVisible('div=fixed'); // 'fixed' is a default streamboss mode

  t.pass();
});

// TODO: flaky
test('Stream Boss Manage Battle settings', async t => {
  const client = t.context.app.client;
  if (!(await logIn(t))) return;
  await addSource(t, 'Stream Boss', '__Stream Boss', false);

  await client.click('li=Manage Battle');

  const formMonkey = new FormMonkey(t, 'form[name=manage-battle-form]');

  const testSet1 = {
    boss_heal: false,
    fade_time: 5,
    skin: 'noimg',
    follow_multiplier: 1,
    bit_multiplier: 2,
    sub_multiplier: 3,
    donation_multiplier: 4,
  };

  await waitForWidgetSettingsSync(t, () => formMonkey.fill(testSet1));
  t.true(await formMonkey.includes(testSet1));

  const testSet2 = {
    boss_heal: true,
    fade_time: 10,
    skin: 'default',
    follow_multiplier: 5,
    bit_multiplier: 1,
    sub_multiplier: 300,
    donation_multiplier: 200,
  };

  await waitForWidgetSettingsSync(t, () => formMonkey.fill(testSet2));
  t.true(await formMonkey.includes(testSet2));
});

// TODO flaky
test.skip('Stream Boss Manage Visual Settings', async t => {
  const client = t.context.app.client;
  if (!(await logIn(t))) return;
  await addSource(t, 'Stream Boss', '__Stream Boss', false);

  await client.click('li=Visual Settings');
  const formMonkey = new FormMonkey(t, 'form[name=visual-settings-form]');

  const testSet1 = {
    text_color: '#FF0000',
    bar_text_color: '#FF0000',
    bar_color: '#FF0000',
    bar_bg_color: '#FF0000',
    font: 'Sacramento',
  };
  await waitForWidgetSettingsSync(t, () => formMonkey.fill(testSet1));
  t.true(await formMonkey.includes(testSet1));

  const testSet2 = {
    text_color: '#FFFFFF',
    bar_text_color: '#FFFFFF',
    bar_color: '#FFFFFF',
    bar_bg_color: '#46E65A',
    font: 'Roboto',
  };
  await waitForWidgetSettingsSync(t, () => formMonkey.fill(testSet2));
  t.true(await formMonkey.includes(testSet2));
});
