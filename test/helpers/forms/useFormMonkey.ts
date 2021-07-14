import { TExecutionContext } from '../spectron';
import * as inputControllers from './inputs';
import { BaseInputController } from './base';
import { pascalize } from 'humps';

type TFieldFiller = string;
const DEFAULT_FORM_SELECTOR = 'body';

interface IInputDescriptor {
  type: string;
  name: string;
  label: string;
}

export function useForm(t: TExecutionContext, name?: string) {
  const client = t.context.app.client;
  const formSelector = name ? `[data-role="form"][data-name="${name}"]` : DEFAULT_FORM_SELECTOR;

  async function getInputElements(): Promise<WebdriverIO.ElementArray> {
    // wait for form appear
    if (formSelector !== DEFAULT_FORM_SELECTOR) {
      (await client.$(formSelector)).waitForExist({ timeout: 15000 });
    }

    const $inputs = await client.$$(`${formSelector} [data-role=input]`);
    return $inputs;
  }

  async function readForm() {
    const controllers = await getInputControllers();
    const values: { name: string; value: any }[] = [];
    for (const inputController of controllers) {
      const name = inputController.name;
      const value = await inputController.getValue();
      values.push({ name, value });
    }
    return values;
  }

  async function fillForm(formData: Record<string, any>) {
    const controllers = await getInputControllers();
    const inputNames = Object.keys(formData);

    for (const inputName of inputNames) {
      const controller = controllers.find(c => c.name === inputName);
      if (!controller) {
        throw new Error(`No field or controller found for name=${inputName}`);
      }
      const isSuccess = await controller.setValue(formData[inputName]);
      if (!isSuccess) {
        throw new Error(`Element found but failed to set the value for name=${inputName}`);
      }
    }
  }

  async function getInputControllers() {
    const $inputs = await getInputElements();
    const controllers: BaseInputController<any>[] = [];
    for (const $input of $inputs) {
      const type = await $input.getAttribute('data-type');
      const name = await $input.getAttribute('data-name');
      console.log(`Found input ${type} with name ${name}`);
      const InputControllerClass = getInputControllerForType(type);
      if (!InputControllerClass) {
        console.log('No controller found for type', type);
        continue;
      }
      const inputController = new InputControllerClass(t, $input, name);
      controllers.push(inputController);
    }
    return controllers;
  }

  return { readForm, fillForm };
}

function getInputControllerForType<
  TReturnType extends new (...args: any) => BaseInputController<any>
>(type: string): TReturnType {
  const controllerName = pascalize(type) + 'InputController';
  return inputControllers[controllerName];
}

// const { fill, read } = useForm(t);
// const { userName, email } = await read();
//
// t.equals(userName, 'Alex', 'User name should be Alex');
// t.endsOn(userName, '@logitech.com', 'User email should be');
