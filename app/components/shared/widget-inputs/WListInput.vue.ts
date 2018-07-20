import { Component, Prop } from 'vue-property-decorator';
import { IObsListOption } from '../forms/ObsInput';
import { Multiselect } from 'vue-multiselect';
import { IWInputMetadata, WInput } from './WInput';

export interface IWListMetadata<TValueType> extends IWInputMetadata {
  options: IListOption<TValueType>[];
}


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

  get currentValue() {

<<<<<<< Updated upstream
    const option = this.metadata.options.find((opt: IListOption<string>) => {
=======
    const option = options.find((opt: IObsListOption<string>) => {
>>>>>>> Stashed changes
      return this.value === opt.value;
    });

    if (option) return option;
    return this.metadata.options[0];
  }

<<<<<<< Updated upstream
=======
  get multiselectOptions(): IObsListOption<string>[] {
    return this.options.options.map(item => {
      return { value: item.value, description: item.title };
    });
  }

  get selectedOption(): IWListOption<string> {
    return this.options.options.find(option => option.value === this.value);
  }
>>>>>>> Stashed changes
}
