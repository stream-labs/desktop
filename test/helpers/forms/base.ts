import { TExecutionContext } from '../spectron';
import { SpectronClient } from 'spectron';
import { errorMessage } from 'aws-sdk/clients/datapipeline';

export type TSelectorOrEl = string | WebdriverIO.Element;

export abstract class BaseInputController<TValue> {
  protected client: SpectronClient;

  constructor(
    protected t: TExecutionContext,
    private selectorOrEl: TSelectorOrEl,
    public name: string,
  ) {
    this.client = t.context.app.client;
  }

  async getElement() {
    return getElement(this.t, this.selectorOrEl);
  }
  abstract async setValue(value: TValue): Promise<string | Error | void>;
  abstract async getValue(): Promise<TValue>;
}

export async function getElement(
  t: TExecutionContext,
  selectorOrEl: TSelectorOrEl,
): Promise<WebdriverIO.Element> {
  if (typeof selectorOrEl === 'string') {
    return await t.context.app.client.$(selectorOrEl);
  }
  return selectorOrEl;
}

export async function setInputValue(
  t: TExecutionContext,
  selectorOrEl: TSelectorOrEl,
  value: string,
) {
  const $el = await getElement(t, selectorOrEl);
  const client = t.context.app.client;
  await $el.waitForDisplayed();
  await $el.click();
  await ((client.keys(['Control', 'a']) as any) as Promise<any>); // select all
  await ((client.keys('Control') as any) as Promise<any>); // release ctrl key
  await ((client.keys('Backspace') as any) as Promise<any>); // clear
  await $el.click(); // click again if it's a list input
  await ((client.keys(value) as any) as Promise<any>); // type text
}
