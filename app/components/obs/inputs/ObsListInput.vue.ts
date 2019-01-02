import { Component, Prop } from 'vue-property-decorator';
import { TObsType, IObsListInput, IObsListOption, ObsInput, TObsValue } from './ObsInput';
import { Multiselect } from 'vue-multiselect';

@Component({
  components: { Multiselect },
})
class ObsListInput extends ObsInput<IObsListInput<TObsValue>> {
  static obsType: TObsType;

  @Prop()
  value: IObsListInput<TObsValue>;

  @Prop({ default: false })
  allowEmpty: boolean;

  @Prop({ default: true })
  internalSearch: boolean;

  @Prop({ default: 'Select Option' })
  placeholder: string;

  @Prop({ default: false })
  loading: boolean;

  onInputHandler(option: IObsListOption<string>) {
    this.emitInput({ ...this.value, value: option ? option.value : null });
  }

  onSearchChange(value: string) {
    this.$emit('search-change', value);
  }

  get currentValue() {
    const option = this.value.options.find((opt: IObsListOption<string>) => {
      return this.value.value === opt.value;
    });

    if (option) return option;
    if (this.allowEmpty) return '';
    return this.value.options[0];
  }
}

ObsListInput.obsType = 'OBS_PROPERTY_LIST';

export default ObsListInput;
