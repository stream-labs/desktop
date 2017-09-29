import { Component, Prop } from 'vue-property-decorator';
import { Input, IFormInput, TObsType } from './Input';

@Component
class BoolInput extends Input<IFormInput<boolean>> {

  static obsType: TObsType;

  @Prop()
  value: IFormInput<boolean>;

  onChangeHandler(event: Event) {
    this.emitInput({ ...this.value, value: !!event.target['checked'] });
  }

}

BoolInput.obsType = 'OBS_PROPERTY_BOOL';

export default BoolInput;
