import { Component, Prop } from 'vue-property-decorator';
import { Input, IFormInput, TObsType } from './Input';

@Component
class ButtonInput extends Input<IFormInput<boolean>> {

  static obsType: TObsType;

  @Prop()
  value: IFormInput<boolean>;

  handleClick() {
    this.emitInput({ ...this.value, value: true });
  }

}

ButtonInput.obsType = 'OBS_PROPERTY_BUTTON';

export default ButtonInput;
