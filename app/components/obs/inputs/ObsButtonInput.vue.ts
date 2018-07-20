import { Component, Prop } from 'vue-property-decorator';
import { ObsInput, IObsInput, TObsType } from './ObsInput';

@Component
class ObsButtonInput extends ObsInput<IObsInput<boolean>> {

  static obsType: TObsType;

  @Prop()
  value: IObsInput<boolean>;

  handleClick() {
    this.emitInput({ ...this.value, value: true });
  }

}

ObsButtonInput.obsType = 'OBS_PROPERTY_BUTTON';

export default ObsButtonInput;
