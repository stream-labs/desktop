import { Component, Prop } from 'vue-property-decorator';
import { IObsInput, TObsType, ObsInput } from './ObsInput';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';

@Component({
  components: { HFormGroup },
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
      type: 'number',
      disabled: this.value.enabled === false,
      title: this.value.description,
    };
  }

  updateValue(value: number) {
    this.emitInput({ ...this.value, value });
  }
}

ObsNumberInput.obsType = ['OBS_PROPERTY_DOUBLE', 'OBS_PROPERTY_FLOAT'];

export default ObsNumberInput;
