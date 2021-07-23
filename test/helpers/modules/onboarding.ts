import {click, clickButton, clickIfDisplayed, isDisplayed, select, useMainWindow} from './core';

export async function skipOnboarding() {
  await useMainWindow(async () => {
    if (!(await isDisplayed('span=Skip'))) return;
    await click('span=Skip');
    await clickIfDisplayed('div=Choose Starter');
    await clickIfDisplayed('div=Start Fresh');
    await clickButton('Skip');
    await clickButton('Skip');
  });
}
