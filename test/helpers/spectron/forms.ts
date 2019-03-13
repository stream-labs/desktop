// Tools for dealing with forms in spectron

import { TExecutionContext } from './index';

async function getNthLabelId(t: TExecutionContext, label: string, index: number) {
  const el = await t.context.app.client.$$(`label=${label}`);
  try {
    return (el[index] as any).ELEMENT;
  } catch (e) {
    throw new Error(`Could not find element with label ${label}`);
  }
}

export async function setFormInput(t: TExecutionContext, label: string, value: string, index = 0) {
  const id = await getNthLabelId(t, label, index);

  await t.context.app.client.elementIdElement(id, '../..').setValue('input', value);
}

export async function getFormInput(t: TExecutionContext, label: string, index = 0) {
  const id = await getNthLabelId(t, label, index);

  return t.context.app.client.elementIdElement(id, '../..').getValue('input');
}

export async function getFormCheckbox(
  t: TExecutionContext,
  label: string,
  index = 0,
): Promise<boolean> {
  const id = await getNthLabelId(t, label, index);

  return t.context.app.client.elementIdElement(id, '../input').isSelected();
}

export async function clickFormInput(t: TExecutionContext, label: string, index = 0) {
  const id = await getNthLabelId(t, label, index);

  await t.context.app.client.elementIdElement(id, '../..').click('input');
}

export async function setFormDropdown(
  t: TExecutionContext,
  label: string,
  value: string,
  index = 0,
) {
  const id = await getNthLabelId(t, label, index);

  await t.context.app.client.elementIdElement(id, '../..').click('.multiselect');

  await t.context.app.client.elementIdElement(id, '../..').click(`li=${value}`);
}

export async function getDropdownOptions(t: TExecutionContext, selector: string) {
  const els = await t.context.app.client.execute((selector: string) => {
    return Array.from(document.querySelectorAll(selector)).map(el => el.textContent);
  }, selector);

  return els.value;
}

// Percent is a value between 0 and 1
export async function setSliderPercent(
  t: TExecutionContext,
  label: string,
  percent: number,
  index = 0,
) {
  const id = await getNthLabelId(t, label, index);

  const width = await t.context.app.client
    .elementIdElement(id, '../..')
    .$('.vue-slider')
    .getCssProperty('width');

  await t.context.app.client
    .elementIdElement(id, '../..')
    .leftClick('.vue-slider', Math.floor(Number(width.parsed.value) * percent), 0);
}
