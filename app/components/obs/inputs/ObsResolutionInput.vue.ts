import { Component, Prop } from 'vue-property-decorator';
import { TObsType, IObsListInput, ObsInput, TObsValue } from './ObsInput';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { BoolInput, ListInput, NumberInput } from 'components/shared/inputs/inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { $t } from 'services/i18n';

@Component({
  components: { HFormGroup, VFormGroup, ListInput, BoolInput, NumberInput },
})
class ObsResolutionInput extends ObsInput<IObsListInput<TObsValue>> {
  static obsType: TObsType;

  @Prop()
  value: IObsListInput<string>;

  @Prop({ default: 'Select Option or Type New Value' })
  placeholder: string;

  @Prop({ default: false })
  allowEmpty: boolean;

  private customResolution = '';

  onSelectHandler(value: string) {
    this.customResolution = '';
    this.emitInput({ ...this.value, value });
  }

  get metadata() {
    const options = this.value.options.map(opt => ({ title: opt.description, value: opt.value }));
    if (this.customResolution) {
      options.unshift({
        title: `${$t('Use custom resolution')} ${this.customResolution}`,
        value: this.customResolution,
      });
    }
    return {
      disabled: this.value.enabled === false,
      options,
      allowEmpty: this.allowEmpty,
      placeholder: this.placeholder,
    };
  }

  onSearchHandler(search: string) {
    if (search) {
      const match = search.match(/\d+/g) || [];
      const width = match[0] || 400;
      const height = match[1] || 400;
      const value = `${width}x${height}`;
      this.customResolution = value;
    } else {
      this.customResolution = '';
    }
  }
}

ObsResolutionInput.obsType = 'OBS_INPUT_RESOLUTION_LIST';

export default ObsResolutionInput;
