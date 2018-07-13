import Vue from 'vue';
import { Prop } from 'vue-property-decorator';
import uuid from 'uuid/v4';
import { Validator } from 'vee-validate';
import { $t } from 'services/i18n';

// rules https://baianat.github.io/vee-validate/guide/rules.html
const dictionary = {
  en: {
    messages: {
      required: () => $t('The field is required'),
      min_value: (fieldName: string, params: number[]) => `The field value must be ${ params[0] } or larger`,
      max_value: (fieldName: string, params: number[]) => `The field value must be ${ params[0] } or less`,
      date_format: (fieldName: string, params: number[]) => `The date must be in ${ params[0] } format`
    }
  }
};

// Override and merge the dictionaries
Validator.localize(dictionary);


export interface IWInputMetadata {
  required?: boolean;
  description?: string;
  hint?: string;
}

export abstract class WInput<TValueType, TMetadataType extends IWInputMetadata> extends Vue {

  @Prop()
  value: TValueType;

  @Prop()
  label: string;

  @Prop()
  metadata: TMetadataType;

  uuid = uuid(); // uuid serves to link input field and validator message

  emitInput(eventData: TValueType) {
    this.$emit('input', eventData);
  }

  get options(): TMetadataType {
    return this.metadata || {} as TMetadataType;
  }

  get required(): boolean {
    return this.options.required === void 0 ? false : this.options.required;
  }

  get description(): string {
    return this.options.description === void 0 ? '' : this.options.description;
  }

  get hint() {
    return this.options.hint === void 0 ? '' : this.options.hint;
  }
}

