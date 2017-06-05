// Source helper functions
import { focusMain, focusChild } from '.';

async function clickSourceAction(t, selector) {
  await t.context.app.client
    .$('h4=Sources')
    .$('..')
    .click(selector);
}

export async function clickAddSource(t) {
  await clickSourceAction(t, '.fa-plus');
}

export async function clickRemoveSource(t) {
  await clickSourceAction(t, '.fa-minus');
}

export async function clickSourceProperties(t) {
  await clickSourceAction(t, '.fa-cog');
}

export async function selectSource(t, name) {
  await t.context.app.client.click(`li=${name}`);
}

export async function addSource(t, type, name) {
  const app = t.context.app;

  await focusMain(t);
  await clickAddSource(t);

  await focusChild(t);
  await app.client.click(`li=${type}`);
  await app.client.setValue('input', name);
  await app.client.click('button=Done');

  // Close source properties too
  await app.client.click('button=Done');
}
