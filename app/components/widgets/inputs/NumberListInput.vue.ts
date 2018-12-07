import { Component, Prop } from 'vue-property-decorator';
import { Multiselect } from 'vue-multiselect';
import { IListMetadata, IListOption } from 'components/shared/inputs/index';
import { BaseInput } from 'components/shared/inputs/BaseInput';

interface IMultiselectListOption{
  description: string;
  value: number;
}

@Component({
  components: { Multiselect }
})

export default class ListInput extends BaseInput<number, IListMetadata<number>> {

  @Prop()
  readonly value: number;

  @Prop()
  readonly metadata: IListMetadata<number>;

  @Prop()
  readonly title: string;

  @Prop({ default: 'Select Option' })
  readonly placeholder: string;


  onInputHandler(option: IMultiselectListOption) {
    if (option) {
      this.emitInput(option.value);
      this.$nextTick();
    }
  }

  getOptions(): IListMetadata<number> {
    const options = super.getOptions();
    return {
      ...options,
      allowEmpty: !!options.allowEmpty // undefined value is not working for vue-multiselect
    }
  }

  get currentMultiselectValue() {
    const options = this.multiselectOptions;

    const option = options.find((opt: IMultiselectListOption) => {
      return this.value === opt.value;
    });

    if (option) return option;
    return options[0];
  }


  get multiselectOptions(): IMultiselectListOption[] {
    return this.options.options.map(item => {
      return { value: item.value, description: item.title };
    });
  }

  get selectedOption(): IListOption<number> {
    return this.options.options.find(option => option.value === this.value);
  }

}
