import Vue from 'vue';
import { cloneDeep } from 'lodash';
import { Prop } from 'vue-property-decorator';
import uuid from 'uuid/v4';
import { Validator } from 'vee-validate';
import { $t } from 'services/i18n';


export enum EWInputType {
  bool = 'bool',
  number = 'number',
  text = 'text',
  slider = 'slider',
  color = 'color',
  list = 'list',
  textArea = 'textArea',
  fontSize = 'fontSize',
  fontFamily = 'fontFamily',
  code = 'code',
  animation = 'animation'
}

/**
 * base interface for all metadata types
 */
export interface IWInputMetadata {
  required?: boolean;
  description?: string;
  hint?: string;
  type?: EWInputType;
  title?: string;
}

export interface IWNumberMetadata extends IWInputMetadata {
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface IWListMetadata<TValueType> extends IWInputMetadata {
  options: IWListOption<TValueType>[];
}

export interface IWTextMetadata extends IWInputMetadata {
  placeholder?: string;
  max?: number;
  dateFormat?: string;
}

export interface IWSliderMetadata extends IWInputMetadata {
  min: number;
  max: number;
  interval?: number;
  usePercentages?: boolean;
}

export interface IWListOption<TValue> {
  value: TValue;
  title: string;
  description?: string;
}

// a helper for creating metadata
export const metadata = {
  bool: (options: IWInputMetadata) => ({ type: EWInputType.bool, ...options } as IWInputMetadata),
  number: (options: IWNumberMetadata) => ({ type: EWInputType.number, ...options } as IWNumberMetadata),
  text: (options: IWTextMetadata) => ({ type: EWInputType.text, ...options } as IWTextMetadata),
  list: (options: IWListMetadata<string>) => ({ type: EWInputType.list, ...options } as IWListMetadata<string>),
  color: (options: IWInputMetadata) => ({ type: EWInputType.color, ...options } as IWInputMetadata),
  slider: (options: IWSliderMetadata) => ({ type: EWInputType.slider, ...options } as IWSliderMetadata),
  textArea: (options: IWTextMetadata) => ({ type: EWInputType.textArea, ...options } as IWTextMetadata),
  fontSize: (options: IWInputMetadata) => ({ type: EWInputType.fontSize, ...options } as IWInputMetadata),
  fontFamily: (options: IWInputMetadata) => ({ type: EWInputType.fontFamily, ...options } as IWInputMetadata),
  code: (options: IWInputMetadata) => ({ type: EWInputType.code, ...options } as IWInputMetadata),
  animation: (options: IWInputMetadata) => ({ type: EWInputType.animation, ...options } as IWInputMetadata)
};

// rules https://baianat.github.io/vee-validate/guide/rules.html
const validationMessages = {
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
Validator.localize(validationMessages);


export abstract class WInput<TValueType, TMetadataType extends IWInputMetadata> extends Vue {

  @Prop()
  value: TValueType;

  @Prop()
  title: string;

  @Prop()
  metadata: TMetadataType;

  uuid = uuid(); // uuid serves to link input field and validator message

  emitInput(eventData: TValueType) {
    this.$emit('input', eventData);
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
    const metadata = this.metadata || {} as TMetadataType;
    const options = cloneDeep(metadata);
    options.title = this.title || metadata.title;
    return options;
  }

  get options(): TMetadataType {
    return this.getOptions();
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

