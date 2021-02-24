import { TExecutionContext } from './spectron';

type TFieldFiller = string;
const DEFAULT_FORM_SELECTOR = 'body';

interface IInputDescriptor {
  type: string;
  name: string;
  label: string;
}

function useForm(t: TExecutionContext, name?: string) {
  const client = t.context.app.client;
  const formSelector = name ? `[data-role="form"][data-name="${name}"]` : DEFAULT_FORM_SELECTOR;

  async function readInputs(): Promise<IInputDescriptor[]> {
    // wait for form appear
    if (formSelector !== DEFAULT_FORM_SELECTOR) {
      await client.waitForExist(formSelector, 15000);
    }

    const $inputs = await client.$$(`${formSelector} [data-role=input]`);
    return await Promise.all(
      $inputs.map(async $el => {
        const type =
        return {
          type: await getAttribute($el, 'data-type'),
          name: await getAttribute($el, 'data-name'),
          label: await getAttribute($el, 'data-label'),
        };
      }),
    );
  }

  async function getAttribute(selectorOrElement: string | any, attrName: string) {
    let element;
    if (typeof selectorOrElement === 'string') {
      element = client.$(selectorOrElement);
    } else {
      element = selectorOrElement;
    }
    const id = element.value.ELEMENT;
    return (await client.elementIdAttribute(id, attrName)).value;
  }

  async function read() {
    const inputs = await readInputs();

  }

  return { read };
}


const { fill, read } = useForm(t);
const { userName, email } = await read();

t.equals(userName, 'Alex', 'User name should be Alex');
t.endsOn(userName, '@logitech.com', 'User email should be');


