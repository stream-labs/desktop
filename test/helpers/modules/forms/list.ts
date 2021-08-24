import { BaseInputController } from './base';
import { getClient, select } from '../core';
import { sleep } from '../../sleep';

export class ListInputController<TValue> extends BaseInputController<TValue> {
  async setValue(value: TValue) {
    // open dropdown
    await this.open();
    await this.waitForLoading();

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
    const $el = await this.getElement();

    // open dropdown
    await this.open();
    await this.waitForLoading();

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

  async open() {
    const $el = await this.getElement();
    await $el.click();
    await sleep(100);
  }

  async getOptions(): Promise<{ label: string; value: string }[]> {
    await this.open();
    await this.waitForLoading();
    const $options = await getClient().$$('.ant-select-item-option');
    const result: { label: string; value: string }[] = [];
    for (const $opt of $options) {
      const value = await $opt.getAttribute('data-option-value');
      const label = await $opt.getAttribute('data-option-label');
      result.push({ value, label });
    }
    await (await this.getElement()).click(); // close the popup
    return result;
  }

  async hasOption(label: string): Promise<boolean> {
    const options = await this.getOptions();
    const option = options.find(opt => opt.label === label);
    return !!option;
  }
}
