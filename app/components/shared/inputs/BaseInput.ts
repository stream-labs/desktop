import Vue from 'vue';
import { cloneDeep } from 'lodash';
import { Prop } from 'vue-property-decorator';
import uuid from 'uuid/v4';
import { IInputMetadata } from './index';
import { $t } from 'services/i18n';

export abstract class BaseInput<TValueType, TMetadataType extends IInputMetadata> extends Vue {

  @Prop()
  value: TValueType;

  @Prop()
  title: string;

  @Prop()
  metadata: TMetadataType;

  uuid = uuid(); // uuid serves to link input field and validator message

  emitInput(eventData: TValueType, event?: any) {
    this.$emit('input', eventData, event);
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

