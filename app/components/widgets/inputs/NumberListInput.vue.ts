import { Component, Prop } from 'vue-property-decorator';
import { Multiselect } from 'vue-multiselect';
import { IListMetadata, IListOption } from 'components/shared/inputs';
import { BaseInput } from 'components/shared/inputs/BaseInput';

@Component({ components: { Multiselect } })
export default class ListInput extends BaseInput<number, IListMetadata<number>> {
  @Prop() readonly value: number;

  @Prop() readonly metadata: IListMetadata<number>;

  @Prop() readonly title: string;

  @Prop({ default: 'Select Option' })
  readonly placeholder: string;

  onInputHandler(option: IListOption<number>) {
    if (option) {
      this.emitInput(option.value);
      this.$nextTick();
    }
  }

  getOptions(): IListMetadata<number> {
    const options = super.getOptions();
    return {
      ...options,
      allowEmpty: !!options.allowEmpty, // undefined value is not working for vue-multiselect
    };
  }

  get currentMultiselectValue() {
    const option = this.options.options.find(
      (opt: IListOption<number>) => this.value === opt.value,
    );

    if (option) return option;
    if (this.options.allowEmpty) return null;
    return this.options.options[0];
  }

  get selectedOption(): IListOption<number> {
    return this.options.options.find(option => option.value === this.value);
  }
}
