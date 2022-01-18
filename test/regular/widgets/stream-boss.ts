import { test, runWithSpectron } from '../../helpers/spectron';
import { addSource } from '../../helpers/modules/sources';
import { logIn } from '../../helpers/spectron/user';
import { FormMonkey } from '../../helpers/form-monkey';
import { waitForWidgetSettingsSync } from '../../helpers/widget-helpers';

runWithSpectron();

test.skip('Set stream-boss health', async t => {
  if (!(await logIn(t))) return;

  const client = t.context.app.client;
  await addSource('Stream Boss', '__Stream Boss', false);

  const setButtonSelector = 'button=Set Stream Boss Health';
  const resetButtonSelector = 'button=Reset Stream Boss';

  if (await (await client.$(resetButtonSelector)).isDisplayed()) {
    await (await client.$(resetButtonSelector)).click();
  }

  await (await client.$(setButtonSelector)).waitForDisplayed({ timeout: 20000 });
  await (await client.$(setButtonSelector)).click();
  await (await client.$('div=fixed')).waitForDisplayed(); // 'fixed' is a default streamboss mode

  t.pass();
});

test.skip('Stream Boss Manage Battle settings', async t => {
  const client = t.context.app.client;
  if (!(await logIn(t))) return;
  await addSource('Stream Boss', '__Stream Boss', false);

  await (await client.$('li=Manage Battle')).click();

  const formMonkey = new FormMonkey(t, 'form[name=manage-battle-form]');

  const testSet1 = {
    boss_heal: false,
    fade_time: 5,
    skin: 'noimg',
  };
  await formMonkey.fill(testSet1);
  await waitForWidgetSettingsSync(t);
  t.true(await formMonkey.includes(testSet1));

  const testSet2 = {
    boss_heal: true,
    fade_time: 10,
    skin: 'default',
  };
  await formMonkey.fill(testSet2);
  await waitForWidgetSettingsSync(t);
  t.true(await formMonkey.includes(testSet2));
});

test.skip('Stream Boss Manage Visual Settings', async t => {
  const client = t.context.app.client;
  if (!(await logIn(t))) return;
  await addSource('Stream Boss', '__Stream Boss', false);

  await (await client.$('li=Visual Settings')).click();
  const formMonkey = new FormMonkey(t, 'form[name=visual-settings-form]');

  const testSet1 = {
    text_color: '#FF0000',
    bar_text_color: '#FF0000',
    bar_color: '#FF0000',
    bar_bg_color: '#FF0000',
    font: 'Sacramento',
  };
  await formMonkey.fill(testSet1);
  await waitForWidgetSettingsSync(t);
  t.true(await formMonkey.includes(testSet1));

  const testSet2 = {
    text_color: '#FFFFFF',
    bar_text_color: '#FFFFFF',
    bar_color: '#FFFFFF',
    bar_bg_color: '#46E65A',
    font: 'Roboto',
  };
  await formMonkey.fill(testSet2);
  await waitForWidgetSettingsSync(t);
  t.true(await formMonkey.includes(testSet2));
});
