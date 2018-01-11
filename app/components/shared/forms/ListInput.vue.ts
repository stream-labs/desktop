import { Component, Prop } from 'vue-property-decorator';
import { TObsType, IListInput, IListOption, Input, TObsValue } from './Input';
import { Multiselect } from 'vue-multiselect';

@Component({
  components: { Multiselect }
})

class ListInput extends Input<IListInput<TObsValue>> {

  static obsType: TObsType[];

  @Prop()
  value: IListInput<TObsValue>;

  @Prop({ default: false })
  allowEmpty: boolean;

  @Prop({ default: 'Select Option' })
  placeholder: string;

  @Prop({ default: false })
  loading: boolean;

  onInputHandler(option: IListOption<string>) {
    this.emitInput({ ...this.value, value: option.value });
  }

  onSearchChange(value: string) {
    this.$emit('search-change', value);
  }

  mounted() {
    if (this.value.type ===  'OBS_INPUT_RESOLUTION_LIST') {
      this.placeholder = 'Select Option or Type New Value';
    }
  }

  get currentValue() {

    const option = this.value.options.find((opt: IListOption<string>) => {
      return this.value.value === opt.value;
    });

    if (option) return option;
    if (this.allowEmpty) return '';
    return this.value.options[0];
  }

  // only for type = OBS_INPUT_RESOLUTION_LIST
  getCustomResolution(search: string) {
    const match = search.match(/\d+/g) || [];
    const width = match[0] || 400;
    const height = match[1] || 400;
    const value = `${ width }x${ height }`;
    return { value, description: value };
  }

}

ListInput.obsType = ['OBS_PROPERTY_LIST', 'OBS_INPUT_RESOLUTION_LIST'];

export default ListInput;
