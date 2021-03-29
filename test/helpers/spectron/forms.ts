// Tools for dealing with forms in spectron

import { TExecutionContext } from './index';

export async function setFormInput(t: TExecutionContext, label: string, value: string, index = 0) {
  const $el = (await t.context.app.client.$$(`label=${label}`))[index];
  const $input = await (await $el.$('../..')).$('input');

  await $input.setValue(value);
}

export async function getFormInput(t: TExecutionContext, label: string, index = 0) {
  const $el = (await t.context.app.client.$$(`label=${label}`))[index];
  const $input = await (await $el.$('../..')).$('input');

  return $input.getValue();
}

export async function getFormCheckbox(
  t: TExecutionContext,
  label: string,
  index = 0,
): Promise<boolean> {
  const $el = (await t.context.app.client.$$(`label=${label}`))[index];
  const $input = await $el.$('../input');

  return $input.isSelected();
}

export async function clickFormInput(t: TExecutionContext, label: string, index = 0) {
  const $el = (await t.context.app.client.$$(`label=${label}`))[index];
  const $input = await (await $el.$('../..')).$('input');

  await $input.click();
}

export async function setFormDropdown(
  t: TExecutionContext,
  label: string,
  value: string,
  index = 0,
) {
  const $el = (await t.context.app.client.$$(`label=${label}`))[index];
  const $multiselect = await (await $el.$('../..')).$('.multiselect');
  await $multiselect.click();

  const $li = await (await $el.$('../..')).$(`li=${value}`);
  await $li.click();
}

// Percent is a value between 0 and 1
export async function setSliderPercent(
  t: TExecutionContext,
  label: string,
  percent: number,
  index = 0,
) {
  const $el = (await t.context.app.client.$$(`label=${label}`))[index];
  const $slider = await (await $el.$('../..')).$('.vue-slider');

  const width = await $slider.getCSSProperty('width');

  await $slider.click({
    button: 'left',
    x: Math.floor(Number(width.parsed.value) * percent),
    y: 0,
  });
}
