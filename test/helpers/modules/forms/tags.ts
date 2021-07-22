import { BaseInputController } from './base';
import { select } from '../core';

export class TagsInputController extends BaseInputController<(string | number)[]> {
  async setValue(values: (string | number)[]) {
    return this.setValuesWith('value', values);
  }

  async getValue() {
    const $el = await this.getElement();
    const valueAttr = await $el.getAttribute('data-value');
    return JSON.parse(valueAttr);
  }

  /**
   * @override
   */
  async getDisplayValue() {
    const $el = await this.getElement();
    const displayValueAttr = await $el.getAttribute('data-display-value');
    return JSON.parse(displayValueAttr);
  }

  /**
   * @override
   */
  async setDisplayValue(values: string[]) {
    await this.setValuesWith('label', values);
  }

  async setValuesWith(target: 'value' | 'label', values: (string | number)[]) {
    // open dropdown
    const $el = await this.getElement();
    await $el.click();

    // click options
    for (const value of values) {
      const $option = await select(`.ant-select-dropdown [data-option-${target}="${value}"]`);
      await $option.waitForClickable();
      await $option.click();
    }

    // close dropdown
    await $el.click();
  }
}
