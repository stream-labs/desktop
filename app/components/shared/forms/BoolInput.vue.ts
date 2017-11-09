import { Component, Prop } from 'vue-property-decorator';
import { Input, IFormInput, TObsType } from './Input';

@Component
class BoolInput extends Input<IFormInput<boolean>> {

  static obsType: TObsType;

  @Prop()
  value: IFormInput<boolean>;

  handleClick() {
    if (this.value.enabled === false) return;
    this.emitInput({ ...this.value, value: !this.value.value });
  }

}

BoolInput.obsType = 'OBS_PROPERTY_BOOL';

export default BoolInput;
