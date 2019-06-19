import { afterAppStart, test, useSpectron } from '../../../helpers/spectron';
import { logIn } from '../../../helpers/spectron/user';
import { fillForm } from '../../../helpers/form-monkey';
import { addWidget, EWidgetType } from '../../../helpers/widget-helpers';
import { useScreentest } from '../../screenshoter';

useSpectron({ appArgs: '--nosync', restartAppAfterEachTest: false });
useScreentest();
afterAppStart(async t => {
  await logIn(t);
  await addWidget(t, EWidgetType.ChatBox, 'chatbox');
});

test('Chatbox Visual Settings', async t => {
  await t.context.app.client.click('li=Visual Settings');
  await fillForm(t, 'form[name=visual-properties-form]', {
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
  });
  t.pass();
});

test('Chatbox Font Settings', async t => {
  await t.context.app.client.click('li=Font Settings');
  await fillForm(t, 'form[name=font-properties-form]', {
    text_color: '#FF0000',
    text_size: 20,
  });
  t.pass();
});

test('Chatbox Font Chatter', async t => {
  await t.context.app.client.click('li=Chatter');
  t.pass();
});
