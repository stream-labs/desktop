import { Component, Prop } from 'vue-property-decorator';
import { WInput } from './WInput';

@Component({})
export default class WBoolInput extends WInput<boolean, {}> {


  @Prop()
  value: boolean;

  @Prop()
  title: string;

  handleClick() {
    this.emitInput(!this.value);
  }

}