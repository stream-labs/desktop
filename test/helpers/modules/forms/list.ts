import { BaseInputController } from './base';
import { select } from '../core';
import { sleep } from '../../sleep';

export class ListInputController<TValue> extends BaseInputController<TValue> {
  async setValue(value: TValue) {
    // open dropdown
    const $el = await this.getElement();
    await $el.click();

    // click option
    const $option = await select(`.ant-select-dropdown [data-option-value="${value}"]`);
    await $option.waitForClickable();
    await $option.click();
  }

  async getValue() {
    const $el = await this.getElement();
    return ($el.getAttribute('data-value') as unknown) as Promise<TValue>;
  }

  async setDisplayValue(value: string) {
    // open dropdown
    const $el = await this.getElement();
    await $el.click();
    await sleep(100);

    // try search if searching is available
    const hasSearch = (await $el.getAttribute('data-show-search')) === 'true';
    if (hasSearch) {
      const $input = await $el.$('input');
      await $input.setValue(value);
      await sleep(100);
    }

    // click option
    const $option = await select(`.ant-select-dropdown [data-option-label="${value}"]`);
    await $option.waitForDisplayed();
    await $option.waitForClickable();
    await $option.click();
  }

  async getDisplayValue() {
    const $el = await this.getElement();
    return $el.getAttribute('data-selected-option-label');
  }
}
