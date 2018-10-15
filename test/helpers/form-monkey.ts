import { GenericTestContext } from 'ava';
import { IInputMetadata } from '../../app/components/shared/inputs';
import { SpectronClient } from 'spectron';
import { sleep } from './sleep';

interface IFormMonkeyFillOptions {
  metadata?: Dictionary<IInputMetadata>
}

/**
 * helper for simulating user input into SLOBS forms
 */
export class FormMonkey {

  private client: SpectronClient;

  constructor(private t: GenericTestContext<any>) {
    this.client = t.context.app.client;
  }

  async fill(formName: string, formData: Dictionary<any>, options: IFormMonkeyFillOptions = {}) {
    const $form = await this.client.$(`[name=${formName}`);

    if (!$form) throw new Error(`form not found: ${formName}`);

    console.log('fetching inputs')
    const $inputs = await this.client.$$(`form[name=${formName}] [data-role=input]`);
    console.log($inputs);

    for (const $input of $inputs) {

      const id = ($input as any).ELEMENT;
      const name = (await this.client.elementIdAttribute(id, 'data-name')).value;

      if (!(name in formData)) continue;

      const type = (await this.client.elementIdAttribute(id, 'data-type')).value;
      const value = formData[name];
      const selector = `form[name=${formName}] [data-name="${name}"]`;

      switch (type) {
        case 'text':
        case 'number':
          await this.setTextValue(selector, value);
          break;
        case 'boolean':
          await this.setBoolValue(selector, value);
          break;
        case 'list':
          await this.setListValue(selector, value);
          break;
        case 'slider':
        case 'font-size':
        case 'font-weight':
          await this.setSliderValue(selector, value);
          break;
        default:
          throw new Error(`No setter found for input type = ${type}`);
      }
    }

  }

  async setTextValue(selector: string, value: string) {
    const inputSelector = selector + ' input';
    await this.client.click(inputSelector);
    await this.client.clearElement(selector + ' input');
    await this.client.setValue(selector + ' input', value);
  }

  async setListValue(selector: string, value: string) {
    await this.client.click(`${selector} .multiselect`);
    await this.client.click(`${selector} [data-option-value="${value}"]`);
  }

  async setBoolValue(selector: string, value: boolean) {
    const checkboxSelector = `${selector} input`;
    this.client.click(checkboxSelector);

    if (!value && await this.client.isSelected(checkboxSelector)) {
      await this.client.click(checkboxSelector);
    }
  }

  async getBoolValue(selector: string): Promise<boolean> {
    const checkboxSelector = `${selector} input`;
    return await this.client.isSelected(checkboxSelector);
  }

  async setSliderValue(sliderInputSelector: string, goalValue: number) {
    const dotSelector = `${sliderInputSelector} .vue-slider-dot`;
    const sliderWidth = await this.client.getElementSize(`${sliderInputSelector} .vue-slider-wrap`, 'width');
    let moveOffset = sliderWidth;

    // reset slider by moving a dot to the left edge
    await this.client.moveToObject(dotSelector);
    await this.client.buttonDown(0);
    await this.client.moveTo(null, -99999, 0);
    await this.client.buttonUp(0);

    // press slider dot
    await this.client.moveToObject(dotSelector);
    await this.client.buttonDown(0);

    // use a bisection method to find the correct slider position
    while (true) {
      let currentValue = await this.getSliderValue(sliderInputSelector);

      if (currentValue === goalValue) {
        // we've found it
        await this.client.buttonUp(0);
        return;
      }

      if (goalValue < currentValue) {
        await this.client.moveTo(null, -Math.round(moveOffset), 0);
      } else {
        await this.client.moveTo(null, Math.round(moveOffset), 0);
      }

      moveOffset = moveOffset / 2;
      if (moveOffset < 0.5) throw new Error('Slider position setup failed');
    }
  }

  async getSliderValue(sliderInputSelector: string): Promise<number> {
    // fetch the value from the slider's tooltip
    return Number(await this.client.getText(`${sliderInputSelector} .vue-slider-tooltip`));
  }

}
