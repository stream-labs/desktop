import { Component, Prop } from 'vue-property-decorator';
import { Multiselect } from 'vue-multiselect';
import { IListMetadata, IListOption } from './index';
import { BaseInput } from './BaseInput';

@Component({
  components: { Multiselect },
})
export default class ListInput extends BaseInput<string, IListMetadata<string>> {
  @Prop()
  readonly value: string;

  @Prop()
  readonly metadata: IListMetadata<string>;

  @Prop()
  readonly title: string;

  @Prop({ default: 'Select Option' })
  readonly placeholder: string;

  onInputHandler(option: IListOption<string>) {
    if (option) {
      this.emitInput(option.value);
      this.$nextTick();
    }
  }

  getOptions(): IListMetadata<string> {
    const options = super.getOptions();
    return {
      ...options,
      allowEmpty: !!options.allowEmpty, // undefined value is not working for vue-multiselect
    };
  }

  get currentMultiselectValue() {
    const options = this.options.options;

    let option = options.find((opt: IListOption<string>) => this.value === opt.value);

    if (this.value && this.options.allowCustom) {
      option = { value: this.value, title: this.value } as IListOption<string>;
      this.options.options.push(option);
    }

    if (option) return option;
    if (!!this.getOptions().allowEmpty) return null;
    return options[0];
  }

  get selectedOption(): IListOption<string> {
    return this.options.options.find(option => option.value === this.value);
  }

  onSearchChange(value: string) {
    this.$emit('search-change', value);
  }
}
