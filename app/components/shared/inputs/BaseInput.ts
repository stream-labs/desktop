import Vue from 'vue';
import { cloneDeep } from 'lodash';
import { Component, Prop } from 'vue-property-decorator';
import uuid from 'uuid/v4';
import { IInputMetadata } from './index';
import ValidatedForm from './ValidatedForm.vue';

export class BaseInput<TValueType, TMetadataType extends IInputMetadata> extends Vue {

  @Prop()
  readonly value: TValueType;

  @Prop()
  readonly title: string;

  @Prop()
  readonly metadata: TMetadataType;

  /**
   * uuid serves to link input field and validator message
   */
  readonly uuid = (this.metadata && this.metadata.uuid) || uuid();

  emitInput(eventData: TValueType, event?: any) {
    this.$emit('input', eventData, event);
    if (this.$parent instanceof ValidatedForm) {
      this.$parent.emitInput(eventData, event);
    }
  }

  getValidations() {
    return { required: this.options.required };
  }

  /**
   * object for vee validate plugin
   */
  get validate() {
    const validations = this.getValidations();
    Object.keys(validations).forEach(key => {
      // VeeValidate recognizes undefined values as valid constraints
      // so just remove it
      if (validations[key] === void 0) delete validations[key];
    });
    return validations;
  }

  getOptions(): TMetadataType {
    // merge props and metadata to the 'options' object
    // override this method if you need add more props to the 'option' object
    const metadata = this.metadata || {} as TMetadataType;
    const options = cloneDeep(metadata);
    options.title = this.title || metadata.title;
    return options;
  }

  get options(): TMetadataType {
    return this.getOptions();
  }

}

