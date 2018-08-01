import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';

@Component({})
export default class WBoolInput extends BaseInput<boolean, {}> {
  @Prop() value: boolean;

  handleClick(e: KeyboardEvent) {
    this.emitInput(!this.value, e);
  }
}