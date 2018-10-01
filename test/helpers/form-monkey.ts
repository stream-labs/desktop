import { GenericTestContext } from 'ava';
import { IInputMetadata } from '../../app/components/shared/inputs';
import { SpectronClient } from 'spectron';

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

  fill(formName: string, formData: Dictionary<any>, options = {}) {
    const $form = this.client.$(`[name=${formName}`);

    if (!$form) throw new Error(`form not found: ${formName}`);

    $form.$$('.slobs-input').forEach($input => {

      $input.getAttribute('class')

      if ($input.classList.contains('text-input')) {

      }

    })

  }

}


