import { Component, Prop } from 'vue-property-decorator';
import { ObsInput, IObsInput, TObsType } from './ObsInput';

@Component
class ObsBoolInput extends ObsInput<IObsInput<boolean>> {
  static obsType: TObsType;

  @Prop()
  value: IObsInput<boolean>;

  handleClick() {
    if (this.value.enabled === false) return;
    this.emitInput({ ...this.value, value: !this.value.value });
  }
}

ObsBoolInput.obsType = 'OBS_PROPERTY_BOOL';

export default ObsBoolInput;
