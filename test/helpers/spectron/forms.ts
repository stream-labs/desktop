// Tools for dealing with forms in spectron

import { GenericTestContext } from 'ava';

async function getNthLabelId(t: GenericTestContext<any>, label: string, index: number) {
  return (await t.context.app.client.$$(label))[index].ELEMENT;
}

export async function setFormInput(t: GenericTestContext<any>, label: string, value: string, index = 0) {
  const id = await getNthLabelId(t, label, index);

  await t.context.app.client
    .elementIdElement(id, 'input')
    .setValue(value);
}

export async function getFormInput(t: GenericTestContext<any>, label: string, index = 0) {
  const id = await getNthLabelId(t, label, index);

  return t.context.app.client
    .elementIdElement(id, 'input')
    .getValue();
}

export async function clickFormInput(t: GenericTestContext<any>, label: string, index = 0) {
  const id = await getNthLabelId(t, label, index);

  await t.context.app.client
    .elementIdElement(id, 'input')
    .click();
}

export async function setFormDropdown(t: GenericTestContext<any>, label: string, value: string, index = 0) {
  const id = await getNthLabelId(t, label, index);

  await t.context.app.client
    .elementIdElement(id, '.multiselect')
    .click();

  await t.context.app.client
    .elementIdElement(id, `[data-test="${value}"]`)
    .click();
}

export async function getFormDropdown(t: GenericTestContext<any>, label: string, index = 0) {
  const id = await getNthLabelId(t, label, index);

  return t.context.app.client
    .elementIdAttribute(id, 'data-test-value');
}

// Percent is a value between 0 and 1
export async function setSliderPercent(t: GenericTestContext<any>, label: string, percent: number, index = 0) {
  const id = await getNthLabelId(t, label, index);

  const width = await t.context.app.client
    .elementIdElement(id, '../..')
    .$('.vue-slider')
    .getCssProperty('width');

  await t.context.app.client
    .elementIdElement(id, '../..')
    .leftClick('.vue-slider', Math.floor(width.parsed.value * percent), 0);
}
