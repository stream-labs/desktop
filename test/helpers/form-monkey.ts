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

  async fill(formName: string, formData: Dictionary<any>, options = {}) {
    const $form = await this.client.$(`[name=${formName}`);

    if (!$form) throw new Error(`form not found: ${formName}`);

    console.log('fetching inputs')
    const $inputs = await this.client.$$(`form[name=${formName}] [data-role=input]`);
    console.log($inputs);

    for (const $input of $inputs) {

      const id = ($input as any).ELEMENT;
      const name = (await this.client.elementIdAttribute(id, 'data-name')).value;

      if (!(name in formData)) continue;
      console.log('found ', name);

      const type = (await this.client.elementIdAttribute(id, 'data-type')).value;
      const value = formData[name];
      const selector = `form[name=${formName}] [data-name="${name}"]`;


      console.log('name', name, 'value', value);

      if (['number', 'text'].includes(type)) {
        const inputSelector = selector + ' input';
        console.log('click');
        await this.client.click(inputSelector);

        console.log('clear');
        await this.client.clearElement(selector + ' input');
        console.log('type');
        await this.client.setValue(selector + ' input', value);

      } else if (type === 'list') {

        await this.client
          .elementIdElement(id, '../..')
          .click('.multiselect');

        await this.client
          .elementIdElement(id, '../..')
          .click(`[data-option-value="${value}"]`);
      } else if (type === 'slider') {

        // console.log('try to swipe');
        // await this.client
        //   .elementIdElement(id, '../..')
        //   .swipe('.vue-slider-dot', 100, 0, 1);
        //

        const dotSelector = `${selector} .vue-slider-dot`;

        console.log('move slider');

        await this.client.moveToObject(dotSelector);
        await this.client.buttonDown(0);
        let i = 10;
        while (i--) {
          console.log('move')
          await this.client.moveTo(null, 5, 0);
          await sleep(1000);
        }
        await this.client.buttonUp(0);
        console.log('move done');

      }


    }

  }


}


