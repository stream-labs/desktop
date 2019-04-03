import { Component, Prop } from 'vue-property-decorator';
import { ObsInput, IObsInput, TObsType } from './ObsInput';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { metadata } from 'components/shared/inputs';
import { BoolInput } from 'components/shared/inputs/inputs';

@Component({
  components: { HFormGroup, BoolInput },
})
class ObsBoolInput extends ObsInput<IObsInput<boolean>> {
  static obsType: TObsType;

  @Prop()
  value: IObsInput<boolean>;

  get metadata() {
    return metadata.bool({
      title: this.value.showDescription !== false ? this.value.description : null,
      name: this.value.name,
      disabled: !this.value.enabled,
    });
  }

  handleClick() {
    if (!this.value.enabled) return;
    this.emitInput({ ...this.value, value: !this.value.value });
  }
}

ObsBoolInput.obsType = 'OBS_PROPERTY_BOOL';

export default ObsBoolInput;
