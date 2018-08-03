import { Component } from 'vue-property-decorator';
import Vue from 'vue';
import { BaseInput } from './BaseInput';
import { IInputMetadata } from './index';

/**
 * VeeValidate doesn't support slots https://github.com/baianat/vee-validate/issues/325
 * this components allows to manage validation across slots
 */
@Component({})
export default class ValidatedForm extends Vue {

  getInputs(): BaseInput<any, IInputMetadata>[] {
    return this.$children
      .filter(child => child instanceof BaseInput) as BaseInput<any, IInputMetadata>[];
  }

  /**
   * validate and show validation messages
   */
  async validate() {
    const inputs = this.getInputs();
    for (let i = 0; i < inputs.length; i++) {
      await inputs[i].$validator.validateAll();
    }
  }

  async validateAndCheckErrors(): Promise<boolean> {
    await this.validate();
    const inputs = this.getInputs();
    let hasErrors = false;
    for (let i = 0; i < inputs.length; i++) {
      if (inputs[i].$validator.errors.count()) {
        hasErrors = true;
      }
    }
    return hasErrors;
  }

}
