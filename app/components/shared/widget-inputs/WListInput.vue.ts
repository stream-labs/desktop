import { Component, Prop } from 'vue-property-decorator';
import { IListOption } from '../forms/Input';
import { Multiselect } from 'vue-multiselect';
import { WInput } from './WInput';

export interface IWListMetadata<TValueType> {
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

  mounted() {
    console.log(this.value);
  }

  onInputHandler(option: IListOption<string>) {
    this.emitInput(option.value);
    this.$nextTick();
  }

  get currentValue() {

    const option = this.metadata.options.find((opt: IListOption<string>) => {
      return this.value === opt.value;
    });

    if (option) return option;
    return this.metadata.options[0];
  }

}
