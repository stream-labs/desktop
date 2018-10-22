import test from 'ava';
import { useSpectron } from '../helpers/spectron/index';
import { addSource } from '../helpers/spectron/sources';
import { logIn, blankSlate } from '../helpers/spectron/user';
import { FormMonkey } from '../helpers/form-monkey';
import { waitForWidgetSettingsSync } from '../helpers/widget-helpers';
import { metadata } from '../../app/components/widgets/inputs';
import { $t } from '../../app/services/i18n';


useSpectron({ appArgs: '--nosync' });



test('Chatbox', async t => {
  const client = t.context.app.client;
  await logIn(t);
  await addSource(t, 'Chatbox', '__Chat Box', false);

  await client.click('li=Visual Settings');
  const formName = 'visual-properties-form';

  const formMonkey = new FormMonkey(t, true);

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
    show_smf_emotes: false,
    background_color: '#FFFFFF',
    message_hide_delay: 10
  };

  await formMonkey.fill(formName, testSet1);
  await waitForWidgetSettingsSync(t);
  t.true(await formMonkey.includes(formName, testSet1));

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
    show_smf_emotes: true,
    background_color: '#000000',
    message_hide_delay: 60
  };

  await formMonkey.fill(formName, testSet2);
  await waitForWidgetSettingsSync(t);
  t.true(await formMonkey.includes(formName, testSet2));
});


test('Stream Boss Manage Visual Settings', async t => {
  const client = t.context.app.client;
  await logIn(t);
  await addSource(t, 'Stream Boss', '__Stream Boss', false);

  await client.click('li=Visual Settings');

  const formMonkey = new FormMonkey(t, true);

  const testSet1 = {
    text_color: '#FF0000',
    bar_text_color: '#FF0000',
    bar_color: '#FF0000',
    bar_bg_color: '#FF0000',
    font: 'Sacramento'
  };
  await formMonkey.fill('visual-settings-form', testSet1);
  await waitForWidgetSettingsSync(t);
  t.true(await formMonkey.includes('visual-settings-form', testSet1));

  const testSet2 = {
    text_color: '#FFFFFF',
    bar_text_color: '#FFFFFF',
    bar_color: '#FFFFFF',
    bar_bg_color: '#46E65A',
    font: 'Roboto'
  };
  await formMonkey.fill('visual-settings-form', testSet2);
  await waitForWidgetSettingsSync(t);
  t.true(await formMonkey.includes('visual-settings-form', testSet2));
});
