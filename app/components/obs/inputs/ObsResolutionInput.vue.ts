import { Component, Prop } from 'vue-property-decorator';
import { TObsType, IObsListInput, ObsInput, TObsValue } from './ObsInput';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { ListInput } from 'components/shared/inputs/inputs';

@Component({
  components: { HFormGroup, ListInput },
})
class ObsResolutionInput extends ObsInput<IObsListInput<TObsValue>> {
  static obsType: TObsType;

  @Prop()
  value: IObsListInput<TObsValue>;

  @Prop({ default: 'Select Option or Type New Value' })
  placeholder: string;

  @Prop({ default: false })
  allowEmpty: boolean;

  onInputHandler(value: string) {
    this.emitInput({ ...this.value, value });
  }

  onSearchChange(value: string) {
    this.$emit('search-change', value);
  }

  get metadata() {
    return {
      disabled: this.value.enabled === false,
      options: this.value.options.map(opt => ({ title: opt.description, value: opt.value })),
      allowEmpty: this.allowEmpty,
      placeholder: this.placeholder,
      allowCustom: this.getCustomResolution,
    };
  }

  getCustomResolution(search: string) {
    const match = search.match(/\d+/g) || [];
    const width = match[0] || 400;
    const height = match[1] || 400;
    const value = `${width}x${height}`;
    return { value, description: value };
  }
}

ObsResolutionInput.obsType = 'OBS_INPUT_RESOLUTION_LIST';

export default ObsResolutionInput;
