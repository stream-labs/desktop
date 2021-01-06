import { Component, Prop } from 'vue-property-decorator';
import { TObsType, IObsListInput, ObsInput, TObsValue } from './ObsInput';
import { ListInput } from 'components/shared/inputs/inputs';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { $t } from 'services/i18n';

@Component({
  components: { HFormGroup, ListInput },
})
class ObsListInput extends ObsInput<IObsListInput<TObsValue>> {
  static obsType: TObsType;

  @Prop()
  value: IObsListInput<TObsValue>;

  @Prop({ default: true })
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
      disabled: this.value.enabled === false,
      placeholder: this.placeholder,
      allowEmpty: false,
      internalSearch: this.internalSearch,
      name: this.value.name,
      title: this.value.description,
      options: this.value.options.map(opt => {
        // treat 0 as an non-selected option if the description is empty
        if (opt.value === 0 && opt.description === '') {
          return { title: $t('Select Option'), value: 0 };
        }
        return { title: opt.description, value: opt.value };
      }),
    };
  }
}

ObsListInput.obsType = 'OBS_PROPERTY_LIST';

export default ObsListInput;
