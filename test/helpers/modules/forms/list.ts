import { BaseInputController, setInputValue } from './base';
import { select } from '../core';
import {sleep} from "../../sleep";

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
    await sleep(500);
    console.log('Dropdown opened');

    // try search if searching is available
    const hasSearch = (await $el.getAttribute('data-show-search')) === 'true';
    if (hasSearch) {
      console.log('Has search opened');
      const $input = await $el.$('input');
      await setInputValue($input, value);
      console.log('Search applied');
    }

    // click option
    const $option = await select(`.ant-select-dropdown [data-option-label="${value}"]`);
    await $option.waitForClickable();
    console.log('Is clickable');
    await $option.click();
    console.log('click');
  }

  async getDisplayValue() {
    const $el = await this.getElement();
    return $el.getAttribute('data-selected-option-label');
  }
}
