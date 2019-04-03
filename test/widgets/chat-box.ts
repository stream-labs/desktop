import { test, useSpectron } from '../helpers/spectron/index';
import { addSource } from '../helpers/spectron/sources';
import { logIn } from '../helpers/spectron/user';
import { FormMonkey } from '../helpers/form-monkey';
import { waitForWidgetSettingsSync } from '../helpers/widget-helpers';

useSpectron({ appArgs: '--nosync' });

test('Chatbox Visual Settings', async t => {
  const client = t.context.app.client;
  if (!(await logIn(t))) return;
  await addSource(t, 'Chatbox', '__Chat Box', false);

  await client.click('li=Visual Settings');
  const formMonkey = new FormMonkey(t, 'form[name=visual-properties-form]');

  const testSet1 = {
    theme: 'boxed',
    show_moderator_icons: false,
    show_subscriber_icons: false,
    show_turbo_icons: false,
    show_premium_icons: false,
    show_bits_icons: false,
    show_coin_icons: false,
    show_bttv_emotes: false,
    show_franker_emotes: false,
    background_color: '#FFFFFF',
    message_hide_delay: 10,
  };

  await formMonkey.fill(testSet1);
  await waitForWidgetSettingsSync(t);
  t.true(await formMonkey.includes(testSet1));

  const testSet2 = {
    theme: 'twitch',
    show_moderator_icons: true,
    show_subscriber_icons: true,
    show_turbo_icons: true,
    show_premium_icons: true,
    show_bits_icons: true,
    show_coin_icons: true,
    show_bttv_emotes: true,
    show_franker_emotes: true,
    background_color: '#000000',
    message_hide_delay: 60,
  };

  await formMonkey.fill(testSet2);
  await waitForWidgetSettingsSync(t);
  t.true(await formMonkey.includes(testSet2));
});

test('Chatbox Font Settings', async t => {
  const client = t.context.app.client;
  if (!(await logIn(t))) return;
  await addSource(t, 'Chatbox', '__Chat Box', false);

  await client.click('li=Font Settings');
  const formMonkey = new FormMonkey(t, 'form[name=font-properties-form]');

  const testSet1 = {
    text_color: '#FF0000',
    text_size: 20,
  };

  await formMonkey.fill(testSet1);
  await waitForWidgetSettingsSync(t);
  t.true(await formMonkey.includes(testSet1));

  const testSet2 = {
    text_color: '#F8E71C',
    text_size: 15,
  };

  await formMonkey.fill(testSet2);
  await waitForWidgetSettingsSync(t);
  t.true(await formMonkey.includes(testSet2));
});
