import { BaseInputController } from './base';

export class SwitchInputController extends BaseInputController<boolean> {
  async setValue(value: boolean) {
    const $el = await this.getElement();
    const currentValue = await this.getValue();
    console.log('current value', currentValue);
    if (currentValue !== value) {
      console.log('wait for enabled');
      await $el.waitForEnabled();
      console.log('click');
      await $el.click();
    }
  }

  async getValue() {
    const $el = await this.getElement();
    return (await $el.getValue()) === 'true';
  }
}
