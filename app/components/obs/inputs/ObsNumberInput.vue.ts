import { Component, Prop } from 'vue-property-decorator';
import { IObsInput, TObsType, ObsInput } from './ObsInput';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { NumberInput } from 'components/shared/inputs/inputs';

@Component({
  components: { HFormGroup, NumberInput },
})
class ObsNumberInput extends ObsInput<IObsInput<number>> {
  static obsType: TObsType[];

  @Prop()
  value: IObsInput<number>;

  $refs: {
    input: HTMLInputElement;
  };

  get metadata() {
    return {
      disabled: this.value.enabled === false,
    };
  }

  updateValue(value: number) {
    this.emitInput({ ...this.value, value });
  }
}

ObsNumberInput.obsType = ['OBS_PROPERTY_DOUBLE', 'OBS_PROPERTY_FLOAT'];

export default ObsNumberInput;
