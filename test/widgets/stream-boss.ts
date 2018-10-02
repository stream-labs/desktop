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
  await blankSlate(t);
  await addSource(t, 'Stream Boss', '__Stream Boss', false);
  //
  // console.log('wait');
  // await sleep(5000);
  console.log('click');
  await client.click('li=Manage Battle');
  console.log('clicked');

  const formMonkey = new FormMonkey(t);

  await formMonkey.fill('manage-battle-form', {
    fade_time: 15
  });

  await sleep(10000);

  // const setButtonSelector = 'button=Set Stream Boss Health';
  // const resetButtonSelector = 'button=Reset Stream Boss';
  //
  // if (await client.isVisible(resetButtonSelector)) {
  //   await client.click(resetButtonSelector);
  // }
  //
  // await client.waitForVisible(setButtonSelector);
  // await client.click(setButtonSelector);
  // await client.waitForVisible('div=fixed'); // 'fixed' is a default streamboss mode

  // await blankSlate(t);
  // t.pass();

});
