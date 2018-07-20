import { Component, Prop } from 'vue-property-decorator';
import { IObsListOption } from '../forms/ObsInput';
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


  onInputHandler(option: IObsListOption<string>) {
    this.emitInput(option.value);
    this.$nextTick();
  }

  get currentMultiselectValue() {
    const options = this.multiselectOptions;

    const option = options.find((opt: IObsListOption<string>) => {
      return this.value === opt.value;
    });

    if (option) return option;
    return options[0];
  }


  get multiselectOptions(): IObsListOption<string>[] {
    return this.options.options.map(item => {
      return { value: item.value, description: item.title };
    });
  }

  get selectedOption(): IWListOption<string> {
    return this.options.options.find(option => option.value === this.value);
  }

}
