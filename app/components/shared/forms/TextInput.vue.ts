import { Component, Prop } from 'vue-property-decorator';
import { IFormInput, TObsType, Input } from './Input';

@Component
class TextInput extends Input<IFormInput<string>> {

  static obsType: TObsType[];

  @Prop()
  value: IFormInput<string>;

  textVisible = !this.value.masked;


  toggleVisible() {
    this.textVisible = !this.textVisible;
  }

  onInputHandler(event: Event) {
    this.emitInput({ ...this.value, value: event.target['value'] });
  }

}

TextInput.obsType = ['OBS_PROPERTY_EDIT_TEXT', 'OBS_PROPERTY_TEXT'];

export default TextInput;
