import { sleep } from './sleep';
import { cloneDeep, isMatch } from 'lodash';
import { TExecutionContext } from './spectron';

interface IUIInput {
  id: string;
  type: string;
  name: string;
  selector: string;
  loading: boolean;
}

const DEFAULT_SELECTOR = 'body';

/**
 * helper for simulating user input into SLOBS forms
 */
export class FormMonkey {
  constructor(
    private t: TExecutionContext,
    private formSelector?: string,
    private showLogs = false,
  ) {
    if (!formSelector) this.formSelector = DEFAULT_SELECTOR;
  }

  get client() {
    return this.t.context.app.client;
  }

  async getInputs(): Promise<IUIInput[]> {
    const formSelector = this.formSelector;

    if (formSelector !== DEFAULT_SELECTOR) {
      await this.client.waitForExist(formSelector, 15000);
    }

    const result = [];
    const $inputs = await this.client.$$(`${formSelector} [data-role=input]`);
    this.log(`${$inputs.length} inputs found in ${formSelector}`);

    for (const $input of $inputs) {
      const id = ($input as any).ELEMENT;
      const name = (await this.client.elementIdAttribute(id, 'data-name')).value;
      if (!name) continue;
      result.push(await this.getInput(name));
    }
    return result;
  }

  async getInput(name: string): Promise<IUIInput> {
    const selector = `${this.formSelector} [data-name="${name}"]`;
    const $el = await this.client.$(selector);
    const id = ($el as any).value.ELEMENT;
    const type = await this.getAttribute(selector, 'data-type');
    const loadingAttr = await this.getAttribute(selector, 'data-loading');
    const loading = loadingAttr === 'true';
    return { id, name, type, selector, loading };
  }

  /**
   * fill the form with values
   */
  async fill(formData: Dictionary<any>) {
    await this.waitForLoading();
    const inputs = await this.getInputs();

    // tslint:disable-next-line:no-parameter-reassignment TODO
    formData = cloneDeep(formData);

    for (const input of inputs) {
      if (!(input.name in formData)) {
        // skip no-name fields
        continue;
      }

      const value = formData[input.name];
      this.log(`set the value for the ${input.type} field: ${input.name} = ${value}`);

      switch (input.type) {
        case 'text':
        case 'number':
        case 'textArea':
          await this.setTextValue(input.selector, value);
          break;
        case 'bool':
          await this.setBoolValue(input.selector, value);
          break;
        case 'list':
        case 'fontFamily':
          await this.setListValue(input.selector, value);
          break;
        case 'color':
          await this.setColorValue(input.selector, value);
          break;
        case 'slider':
        case 'fontSize':
        case 'fontWeight':
          await this.setSliderValue(input.selector, value);
          break;
        case 'twitchTags':
          await this.setTwitchTagsValue(input.selector, value);
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
  async read(): Promise<Dictionary<any>> {
    await this.waitForLoading();
    const inputs = await this.getInputs();
    const formData = {};

    for (const input of inputs) {
      let value;
      this.log(`get the value for the ${input.type} field: ${input.name}`);

      switch (input.type) {
        case 'text':
        case 'textArea':
          value = await this.getTextValue(input.selector);
          break;
        case 'number':
          value = await this.getNumberValue(input.selector);
          break;
        case 'bool':
          value = await this.getBoolValue(input.selector);
          break;
        case 'list':
        case 'fontFamily':
          value = await this.getListValue(input.selector);
          break;
        case 'color':
          value = await this.getColorValue(input.selector);
          break;
        case 'slider':
        case 'fontSize':
        case 'fontWeight':
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

  async includes(expectedData: Dictionary<any>): Promise<boolean> {
    const formData = await this.read();
    this.log('check form includes expected data:');
    this.log(formData);
    this.log(expectedData);
    return isMatch(formData, expectedData);
  }

  async setTextValue(selector: string, value: string) {
    const inputSelector = `${selector} input, ${selector} textarea`;
    await this.client.clearElement(inputSelector);
    await this.client.setValue(inputSelector, value);
  }

  async getTextValue(selector: string): Promise<string> {
    return await this.client.getValue(`${selector} input`);
  }

  async getNumberValue(selector: string): Promise<number> {
    return Number(await this.getTextValue(selector));
  }

  async setListValue(selector: string, value: string) {
    const hasInternalSearch: boolean = JSON.parse(
      await this.getAttribute(selector, 'data-internal-search'),
    );

    if (hasInternalSearch) {
      // the list input has a static list of options
      await this.client.click(`${selector} .multiselect`);
      await this.client.click(`${selector} [data-option-value="${value}"]`);
    } else {
      // the list input has a dynamic list of options

      // type searching text
      await this.setTextValue(selector, value);
      // wait the options list load
      await this.client.waitForExist(`${selector} .multiselect__element`);
      await this.client.click(`${selector} .multiselect__element [data-option-value="${value}"]`);
    }

    // the vue-multiselect's popup-div needs time to be closed
    // otherwise it can overlap the elements under it
    await sleep(100);
  }

  async setColorValue(selector: string, value: string) {
    await this.client.click(`${selector} .colorpicker__input`); // open colorpicker
    // tslint:disable-next-line:no-parameter-reassignment TODO
    value = value.substr(1); // get rid of # character in value
    const inputSelector = `${selector} .vc-input__input`;
    await sleep(100); // give colorpicker some time to be opened
    await this.setInputValue(inputSelector, value);
    await this.client.click(`${selector} .colorpicker__input`); // close colorpicker
    await sleep(100); // give colorpicker some time to be closed
  }

  async getColorValue(selector: string) {
    return await this.client.getValue(`${selector} .colorpicker__input`);
  }

  async getListValue(selector: string): Promise<string> {
    return await this.getAttribute(
      `${selector} .multiselect .multiselect__option--selected span`,
      'data-option-value',
    );
  }

  /**
   * return ListInput options
   */
  async getListOptions(fieldName: string): Promise<{ value: string; title: string }[]> {
    await this.waitForLoading(fieldName);
    const input = await this.getInput(fieldName);
    const optionsEls = await this.client.$$(`${input.selector} [data-option-value]`);
    const values: { value: string; title: string }[] = [];
    for (const el of optionsEls) {
      const id = (el as any).ELEMENT;
      const value = (await this.client.elementIdAttribute(id, 'data-option-value')).value;
      const title = (await this.client.elementIdAttribute(id, 'data-option-title')).value;
      values.push({ value, title });
    }
    return values;
  }

  async getOptionByTitle(fieldName: string, optionTitle: string | RegExp) {
    const options = await this.getListOptions(fieldName);
    const option = options.find(option => {
      return typeof optionTitle === 'string'
        ? option.title === optionTitle
        : !!option.title.match(optionTitle);
    });
    return option.value;
  }

  async setBoolValue(selector: string, value: boolean) {
    const checkboxSelector = `${selector} input`;

    // click to change the checkbox state
    await this.client.click(checkboxSelector);

    // if the current value is not what we need than click one more time
    if (value !== (await this.getBoolValue(selector))) {
      await this.client.click(checkboxSelector);
    }
  }

  async getBoolValue(selector: string): Promise<boolean> {
    const checkboxSelector = `${selector} input`;
    return await this.client.isSelected(checkboxSelector);
  }

  async setSliderValue(sliderInputSelector: string, goalValue: number) {
    await sleep(500); // slider has an initialization delay

    const dotSelector = `${sliderInputSelector} .vue-slider-dot-handle`;

    let moveOffset = await this.client.getElementSize(
      `${sliderInputSelector} .vue-slider`,
      'width',
    );

    // reset slider to 0 position
    await this.client.moveToObject(dotSelector);
    await this.client.buttonDown(0);
    await this.client.moveToObject(`${sliderInputSelector} .vue-slider`, 0, 0);
    await sleep(100); // wait for transitions
    await this.client.buttonUp(0);
    await this.client.moveToObject(dotSelector);
    await this.client.buttonDown();

    // use a bisection method to find the correct slider position
    while (true) {
      const currentValue = await this.getSliderValue(sliderInputSelector);

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

      // wait for transitions
      await sleep(100);

      moveOffset = moveOffset / 2;
      if (moveOffset < 0.3) throw new Error('Slider position setup failed');
    }
  }

  async getSliderValue(sliderInputSelector: string): Promise<number> {
    // fetch the value from the slider's tooltip
    return Number(
      await this.client.getText(
        `${sliderInputSelector} .vue-slider-tooltip-bottom .vue-slider-tooltip`,
      ),
    );
  }

  async setInputValue(selector: string, value: string) {
    await this.client.click(selector);
    await ((this.client.keys(['Control', 'a']) as any) as Promise<any>); // clear
    await ((this.client.keys('Control') as any) as Promise<any>); // release ctrl key
    await ((this.client.keys(value) as any) as Promise<any>); // type text
  }

  async setTwitchTagsValue(selector: string, values: string[]) {
    // clear tags
    const closeSelector = `${selector} .sp-icon-close`;
    while (await this.client.isExisting(closeSelector)) {
      await this.client.click(closeSelector);
    }

    // click to open the popup
    await this.client.click(selector);

    // select values
    const inputSelector = `.v-dropdown-container .sp-search-input`;
    for (const value of values) {
      await this.setInputValue(inputSelector, value);
      await ((this.client.keys('ArrowDown') as any) as Promise<any>);
      await ((this.client.keys('Enter') as any) as Promise<any>);
    }

    // click away and wait for the control to dismiss
    await this.client.click('.tags-container .input-label');
    await this.client.waitForExist('.sp-input-container.sp-open', 500, true);
  }

  /**
   * wait for input to be loaded
   * if no field name provided then wait for all inputs
   */
  async waitForLoading(fieldName?: string) {
    const loadingInputs = (await this.getInputs()).filter(input => {
      return input.loading && (!fieldName || fieldName === input.name);
    });
    const watchers = loadingInputs.map(input => {
      return this.client.waitUntil(async () => (await this.getInput(input.name)).loading === false);
    });
    return Promise.all(watchers);
  }

  private async getAttribute(selector: string, attrName: string) {
    const id = (await this.client.$(selector)).value.ELEMENT;
    return (await this.client.elementIdAttribute(id, attrName)).value;
  }

  private log(...args: any[]) {
    if (!this.showLogs) return;
    console.log(...args);
  }
}

/**
 * a shortcut for FormMonkey.fill()
 */
export async function fillForm(
  t: TExecutionContext,
  selector = DEFAULT_SELECTOR,
  formData: Dictionary<any>,
): Promise<any> {
  return new FormMonkey(t, selector).fill(formData);
}

/**
 * a shortcut for FormMonkey.includes()
 */
export async function formIncludes(
  t: TExecutionContext,
  formData: Dictionary<string>,
): Promise<boolean> {
  return new FormMonkey(t).includes(formData);
}
