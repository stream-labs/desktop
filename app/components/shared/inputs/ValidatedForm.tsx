import { Component } from 'vue-property-decorator';
import Vue from 'vue';
import uuid from 'uuid';
import { ErrorField } from 'vee-validate';
import { BaseInput } from './BaseInput';
import { IInputMetadata } from './index';
import { Subject } from 'rxjs';
import TsxComponent, { createProps } from 'components/tsx-component';

class ValidatedFormProps {
  name?: string = '';
  onInput?: () => void;
}

/**
 * VeeValidate doesn't support slots https://github.com/baianat/vee-validate/issues/325
 * this components allows to manage validation across slots
 */
@Component({ props: createProps(ValidatedFormProps) })
export default class ValidatedForm extends TsxComponent<ValidatedFormProps> {
  validated = new Subject<ErrorField[]>();
  validationScopeId = uuid();

  getInputs(children?: Vue[]): BaseInput<any, IInputMetadata>[] {
    // tslint:disable-next-line:no-parameter-reassignment TODO
    children = children || this.$children;
    const inputs: BaseInput<any, IInputMetadata>[] = [];
    children.forEach(child => {
      if (child instanceof BaseInput) inputs.push(child);
      if (child.$children.length) inputs.push(...this.getInputs(child.$children));
    });
    return inputs;
  }

  /**
   * validate and show validation messages
   */
  async validate() {
    const inputs = this.getInputs();
    for (let i = 0; i < inputs.length; i++) {
      await inputs[i].$validator.validateAll(this.validationScopeId);
    }
    this.validated.next(this.$validator.errors.items);
  }

  async validateAndGetErrors(): Promise<ErrorField[]> {
    await this.validate();
    return this.$validator.errors.items;
  }

  async validateAndGetErrorsCount(): Promise<number> {
    const errors = await this.validateAndGetErrors();
    return errors.length;
  }

  emitInput(data: any, event: Event) {
    this.$emit('input', data, event);
  }

  handleSubmit(event: Event) {
    event.preventDefault();
    this.$emit('submit');
  }

  render() {
    return (
      <form
        data-vv-scope={this.validationScopeId}
        onSubmit={this.handleSubmit}
        name={this.props.name}
      >
        {this.$slots.default}
      </form>
    );
  }
}
