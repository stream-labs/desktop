import { GenericTestContext } from 'ava';
import { IInputMetadata } from '../../app/components/shared/inputs';
import { SpectronClient } from 'spectron';
import { sleep } from './sleep';
import { cloneDeep, isMatch } from 'lodash';

interface IFormMonkeyFillOptions {
  metadata?: Dictionary<IInputMetadata>
}

interface IUIInput {
  id: string;
  type: string;
  name: string;
  selector: string;
}

/**
 * helper for simulating user input into SLOBS forms
 */
export class FormMonkey {

  private client: SpectronClient;

  constructor(private t: GenericTestContext<any>, private showLogs = false) {
    this.client = t.context.app.client;
  }

  async getInputs(formName: string): Promise<IUIInput[]> {
    const formSelector = `form[name=${formName}]`;

    if (!await this.client.isExisting(formSelector)) {
      throw new Error(`form not found: ${formName}`);
    }

    const result = [];
    const $inputs = await this.client.$$(`${formSelector} [data-role=input]`);
    this.log(`${$inputs.length} inputs found in ${formSelector}`);

    for (const $input of $inputs) {
      const id = ($input as any).ELEMENT;
      const name = (await this.client.elementIdAttribute(id, 'data-name')).value;
      const type = (await this.client.elementIdAttribute(id, 'data-type')).value;
      const selector = `form[name=${formName}] [data-name="${name}"]`;
      result.push({ id, name, type, selector})
    }
    return result;
  }

  /**
   * fill the form with values
   */
  async fill(formName: string, formData: Dictionary<any>, options: IFormMonkeyFillOptions = {}) {
    const inputs = await this.getInputs(formName);

    formData = cloneDeep(formData);

    for (const input of inputs) {
      if (!(input.name in formData)) {
        this.log(`field "${name}" skipped`);
        continue;
      }

      const value = formData[input.name];
      this.log(`set the value for the ${input.type} field: ${input.name} = ${value}`);

      switch (input.type) {
        case 'text':
        case 'number':
          await this.setTextValue(input.selector, value);
          break;
        case 'bool':
          await this.setBoolValue(input.selector, value);
          break;
        case 'list':
          await this.setListValue(input.selector, value);
          break;
        case 'slider':
        case 'font-size':
        case 'font-weight':
          await this.setSliderValue(input.selector, value);
          break;
        default:
          throw new Error(`No setter found for input type = ${input.type}`);
      }

      delete formData[input.name];
    }

    const notFoundFields = Object.keys(formData);
    if (notFoundFields.length) {
      throw new Error(`Fields not found: ${JSON.stringify(notFoundFields)}`);
    }

  }

  /**
   * returns all input values from the form
   */
  async read(formName: string): Promise<Dictionary<any>> {
    const inputs = await this.getInputs(formName);
    const formData = {};

    for (const input of inputs) {


      let value;
      this.log(`get the value for the ${input.type} field: ${input.name}`);

      switch (input.type) {
        case 'text':
          value = await this.getTextValue(input.selector);
          break;
        case 'number':
          value = await this.getNumberValue(input.selector);
          break;
        case 'bool':
          value = await this.getBoolValue(input.selector);
          break;
        case 'list':
          value = await this.getListValue(input.selector);
          break;
        case 'slider':
        case 'font-size':
        case 'font-weight':
          value = await this.getSliderValue(input.selector);
          break;
        default:
          throw new Error(`No getter found for input type = ${input.type}`);
      }

      this.log(`got: ${value}`);
      formData[input.name] = value;
    }

    return formData;
  }

  async contains(formName: string, expectedData: Dictionary<any>): Promise<boolean> {
    const formData = await this.read(formName);
    return isMatch(formData, expectedData);
  }

  async setTextValue(selector: string, value: string) {
    const inputSelector = selector + ' input';
    await this.client.click(inputSelector);
    await this.client.clearElement(selector + ' input');
    await this.client.setValue(selector + ' input', value);
  }

  async getTextValue(selector: string): Promise<string> {
    return await this.client.getValue(`${selector} input`);
  }

  async getNumberValue(selector: string): Promise<number> {
    return Number(await this.getTextValue(selector));
  }

  async setListValue(selector: string, value: string) {
    await this.client.click(`${selector} .multiselect`);
    await this.client.click(`${selector} [data-option-value="${value}"]`);
  }

  async getListValue(selector: string): Promise<string> {
    const id = (await this.client.$(`${selector} .multiselect .multiselect__option--selected span`) as any)
      .value
      .ELEMENT;
    return (await this.client.elementIdAttribute(id, 'data-option-value')).value;
  }

  async setBoolValue(selector: string, value: boolean) {
    const checkboxSelector = `${selector} input`;
    await this.client.click(checkboxSelector);

    if (!value && await this.client.isSelected(checkboxSelector)) {
      await this.client.click(checkboxSelector);
    }
  }

  async getBoolValue(selector: string): Promise<boolean> {
    const checkboxSelector = `${selector} input`;
    return await this.client.isSelected(checkboxSelector);
  }

  async setSliderValue(sliderInputSelector: string, goalValue: number) {

    await sleep(500); // slider has an initialization delay

    const dotSelector = `${sliderInputSelector} .vue-slider-dot`;
    const sliderWidth = await this.client.getElementSize(`${sliderInputSelector} .vue-slider-wrap`, 'width');
    let moveOffset = sliderWidth;

    // reset slider to 0 position
    await this.client.moveToObject(dotSelector);
    await this.client.buttonDown(0);
    await this.client.moveToObject(`${sliderInputSelector} .vue-slider`, 0, 0);
    await this.client.buttonUp(0);
    await this.client.moveToObject(dotSelector);
    await this.client.buttonDown();

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

  private log(...args: any[]) {
    if (!this.showLogs) return;
    console.log(...args);
  }
}
