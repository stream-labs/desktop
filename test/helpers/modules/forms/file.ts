import { BaseInputController } from './base';
import { click } from '../core';
import { dialogSelectPath } from '../../spectron/dialog';

export class FileInputController extends BaseInputController<string> {
  async setValue(filePath: string) {
    const $el = await this.getElement();
    const $browseBtn = await (await $el.parentElement()).$('button');
    await click($browseBtn);
    await dialogSelectPath(filePath);
  }

  async getValue() {
    const $el = await this.getElement();
    return $el.getValue();
  }
}
