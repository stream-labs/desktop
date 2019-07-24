import { Component, Prop } from 'vue-property-decorator';
import { Multiselect } from 'vue-multiselect';
import { IListMetadata, IListOption } from './index';
import { BaseInput } from './BaseInput';

interface IMultiselectListOption{
  description: string;
  value: string;
}

@Component({
  components: { Multiselect }
})

export default class ListInput extends BaseInput<string, IListMetadata<string>> {

  @Prop()
  value: string;

  @Prop()
  metadata: IListMetadata<string>;

  @Prop()
  title: string;

  @Prop({ default: 'Select Option' })
  placeholder: string;


  onInputHandler(option: IMultiselectListOption) {
    if (option) {
      this.emitInput(option.value);
      this.$nextTick();
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

  get selectedOption(): IListOption<string> {
    return this.options.options.find(option => option.value === this.value);
  }

}
