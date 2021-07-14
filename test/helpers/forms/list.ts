import { BaseInputController } from './base';
import { sleep } from '../sleep';

export class ListInputController<TValue> extends BaseInputController<TValue> {
  async setValue(value: TValue) {
    const $el = await this.getElement();
    await $el.click();
    const $option = await this.client.$(`.ant-select-dropdown [data-option-value="${value}"]`);
    await $option.waitForClickable();
    await $option.click();
  }

  async getValue() {
    const $el = await this.getElement();
    return ($el.getAttribute('data-value') as unknown) as Promise<TValue>;
  }
}

export function findOption(partialName: string) {}
