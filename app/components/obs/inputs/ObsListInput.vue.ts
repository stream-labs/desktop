import { Component, Prop } from 'vue-property-decorator';
import { TObsType, IObsListInput, IObsListOption, ObsInput, TObsValue } from './ObsInput';
import { ListInput } from 'components/shared/inputs/inputs';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';

@Component({
  components: { HFormGroup, ListInput },
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

  onInputHandler(value: string) {
    this.emitInput({ ...this.value, value });
  }

  onSearchChange(value: string) {
    this.$emit('search-change', value);
  }

  get metadata() {
    return {
      loading: this.loading,
      placeholder: this.placeholder,
      allowEmpty: this.allowEmpty,
      internalSearch: this.internalSearch,
      name: this.value.name,
      options: this.value.options.map(opt => ({ title: opt.description, value: opt.value })),
    };
  }
}

ObsListInput.obsType = 'OBS_PROPERTY_LIST';

export default ObsListInput;
