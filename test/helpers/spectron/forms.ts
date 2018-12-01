// Tools for dealing with forms in spectron

import { TExecutionContext } from './index';

async function getNthLabelId(t: TExecutionContext, label: string, index: number) {
  return (await (t.context.app.client.$$(`label=${label}`))[index] as any).ELEMENT;
}

export async function setFormInput(t: TExecutionContext, label: string, value: string, index = 0) {
  const id = await getNthLabelId(t, label, index);

  await t.context.app.client
    .elementIdElement(id, '../..')
    .setValue('input', value);
}

export async function getFormInput(t: TExecutionContext, label: string, index = 0) {
  const id = await getNthLabelId(t, label, index);

  return t.context.app.client
    .elementIdElement(id, '../..')
    .getValue('input');
}

export async function clickFormInput(t: TExecutionContext, label: string, index = 0) {
  const id = await getNthLabelId(t, label, index);

  await t.context.app.client
    .elementIdElement(id, '../..')
    .click('input');
}

export async function setFormDropdown(t: TExecutionContext, label: string, value: string, index = 0) {
  const id = await getNthLabelId(t, label, index);

  await t.context.app.client
    .elementIdElement(id, '../..')
    .click('.multiselect');

  await t.context.app.client
    .elementIdElement(id, '../..')
    .click(`li=${value}`);
}

// Percent is a value between 0 and 1
export async function setSliderPercent(t: TExecutionContext, label: string, percent: number, index = 0) {
  const id = await getNthLabelId(t, label, index);

  const width = await t.context.app.client
    .elementIdElement(id, '../..')
    .$('.vue-slider')
    .getCssProperty('width');

  await t.context.app.client
    .elementIdElement(id, '../..')
    .leftClick('.vue-slider', Math.floor(Number(width.parsed.value) * percent), 0);
}
