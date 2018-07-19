import { Component, Prop } from 'vue-property-decorator';
import { IListOption } from '../forms/Input';
import { Multiselect } from 'vue-multiselect';
import { IWListMetadata, IWListOption, WInput } from './WInput';

@Component({
  components: { Multiselect }
})

export default class WListInput extends WInput<string, IWListMetadata<string>> {

  @Prop()
  value: string;

  @Prop()
  metadata: IWListMetadata<string>;

  @Prop()
  title: string;

  @Prop({ default: 'Select Option' })
  placeholder: string;


  onInputHandler(option: IListOption<string>) {
    this.emitInput(option.value);
    this.$nextTick();
  }

  get currentMultiselectValue() {

    const options = this.multiselectOptions;

    const option = options.find((opt: IListOption<string>) => {
      return this.value === opt.value;
    });

    if (option) return option;
    return options[0];
  }

  get multiselectOptions(): IListOption<string>[] {
    return this.options.options.map(item => {
      return { value: item.value, description: item.title };
    });
  }

  get selectedOption(): IWListOption<string> {
    return this.options.options.find(option => option.value === this.value);
  }
}
