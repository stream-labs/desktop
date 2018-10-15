import test from 'ava';
import { useSpectron } from '../helpers/spectron/index';
import { addSource } from '../helpers/spectron/sources';
import { logIn, blankSlate } from '../helpers/spectron/user';
import { FormMonkey } from '../helpers/form-monkey';
import { sleep } from '../helpers/sleep';

useSpectron({ appArgs: '--nosync' });

// test('Set stream-boss health', async t => {
//
//   if (!await logIn(t)) return;
//
//   const client = t.context.app.client;
//   await logIn(t);
//   await blankSlate(t);
//   await addSource(t, 'Stream Boss', '__Stream Boss', false);
//
//   const setButtonSelector = 'button=Set Stream Boss Health';
//   const resetButtonSelector = 'button=Reset Stream Boss';
//
//   if (await client.isVisible(resetButtonSelector)) {
//     await client.click(resetButtonSelector);
//   }
//
//   await client.waitForVisible(setButtonSelector);
//   await client.click(setButtonSelector);
//   await client.waitForVisible('div=fixed'); // 'fixed' is a default streamboss mode
//
//   await blankSlate(t);
//   t.pass();
//
// });

//
// test('Set Stream Boss health', async t => {
//
//   if (!await logIn(t)) return;
//
//   const client = t.context.app.client;
//   await logIn(t);
//   await blankSlate(t);
//   await addSource(t, 'Stream Boss', '__Stream Boss', false);
//
//   const formMonkey = new FormMonkey(t);
//
//   await formMonkey.fill('set-goal-form', {
//     total_health: 100,
//     mode: 'incremental'
//   });
//
//   await sleep(15000);
//
//   // const setButtonSelector = 'button=Set Stream Boss Health';
//   // const resetButtonSelector = 'button=Reset Stream Boss';
//   //
//   // if (await client.isVisible(resetButtonSelector)) {
//   //   await client.click(resetButtonSelector);
//   // }
//   //
//   // await client.waitForVisible(setButtonSelector);
//   // await client.click(setButtonSelector);
//   // await client.waitForVisible('div=fixed'); // 'fixed' is a default streamboss mode
//
//   await blankSlate(t);
//   t.pass();
//
// });


test('Stream Boss Manage Battle settings', async t => {
  const client = t.context.app.client;
  await logIn(t);
  await addSource(t, 'Stream Boss', '__Stream Boss', false);
  await client.click('li=Manage Battle');

  const formMonkey = new FormMonkey(t, true);

  const testSet1 = {
    boss_heal: false,
    fade_time: 5,
    skin: 'noimage',
    follow_multiplier: 1,
    bit_multiplier: 2,
    sub_multiplier: 3,
    donation_multiplier: 4
  };

  await formMonkey.fill('manage-battle-form', testSet1);
  t.true(await formMonkey.contains('manage-battle-form', testSet1));

  await sleep(10000);

  const testSet2 = {
    boss_heal: true,
    fade_time: 10,
    skin: 'default',
    follow_multiplier: 5,
    bit_multiplier: 1,
    sub_multiplier: 300,
    donation_multiplier: 200
  };

  await formMonkey.fill('manage-battle-form', testSet2);
  t.true(await formMonkey.contains('manage-battle-form', testSet2));
});
