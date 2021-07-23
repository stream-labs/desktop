import { SpectronClient } from 'spectron';
import { getClient, select, TSelectorOrEl } from '../core';

export abstract class BaseInputController<TValue> {
  protected client: SpectronClient;

  constructor(private selectorOrEl: TSelectorOrEl, public name: string) {}

  async getElement() {
    return select(this.selectorOrEl);
  }
  abstract async setValue(value: TValue): Promise<string | Error | void>;
  abstract async getValue(): Promise<TValue>;

  async setDisplayValue(value: unknown): Promise<string | Error | void> {
    return this.setValue((value as unknown) as TValue);
  }
  async getDisplayValue(): Promise<string> {
    return (this.getValue() as unknown) as Promise<string>;
  }
}

/**
 * Type text in text input
 */
export async function setInputValue(selectorOrEl: TSelectorOrEl, value: string | number) {
  // find element
  const $el = await select(selectorOrEl);
  const client = getClient();
  await $el.waitForDisplayed();

  // focus
  await $el.click();
  await ((client.keys(['Control', 'a']) as any) as Promise<any>); // select all
  await ((client.keys('Control') as any) as Promise<any>); // release ctrl key
  await ((client.keys('Backspace') as any) as Promise<any>); // clear
  await $el.click(); // click again if it's a list input
  await ((client.keys(String(value)) as any) as Promise<any>); // type text
}
