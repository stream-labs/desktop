import { SpectronClient } from 'spectron';
import { getClient } from '../core';

export type TSelectorOrEl = string | WebdriverIO.Element;

export abstract class BaseInputController<TValue> {
  protected client: SpectronClient;

  constructor(private selectorOrEl: TSelectorOrEl, public name: string) {}

  async getElement() {
    return getElement(this.selectorOrEl);
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

export async function getElement(selectorOrEl: TSelectorOrEl): Promise<WebdriverIO.Element> {
  if (typeof selectorOrEl === 'string') {
    return await getClient().$(selectorOrEl);
  }
  return selectorOrEl;
}

/**
 * Type text in text input
 */
export async function setInputValue(selectorOrEl: TSelectorOrEl, value: string | number) {
  // find element
  const $el = await getElement(selectorOrEl);
  const client = getClient();
  await $el.waitForDisplayed();

  // try to focus
  $el.click().catch((e: unknown) => {});
  console.log('clicked');

  // use keyboard to set a new value
  await client.keys(['Control', 'a']); // select all
  await client.keys('Control'); // release ctrl key
  await client.keys('Backspace'); // clear
  await client.keys(String(value)); // type text
}
