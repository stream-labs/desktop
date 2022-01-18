import { click, clickButton, clickIfDisplayed, isDisplayed, runInMainWindow } from './core';

export async function skipOnboarding() {
  await runInMainWindow(async () => {
    if (!(await isDisplayed('span=Skip'))) return;
    await click('span=Skip');
    await clickIfDisplayed('div=Choose Starter');
    await clickIfDisplayed('div=Start Fresh');
    await clickButton('Skip');
    await clickButton('Skip');
  });
}
