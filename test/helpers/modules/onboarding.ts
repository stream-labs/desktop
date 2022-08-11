import { click, clickButton, clickIfDisplayed, isDisplayed, useMainWindow } from './core';

export async function skipOnboarding() {
  await useMainWindow(async () => {
    if (!(await isDisplayed('h2=Live Streaming'))) return;
    await click('h2=Live Streaming');
    await click('button=Continue');
    await click('span=Skip');
    await clickIfDisplayed('div=Start Fresh');
    await clickButton('Skip');
    await clickIfDisplayed('button=Skip');
    await clickIfDisplayed('div=Choose Free');
  });
}
