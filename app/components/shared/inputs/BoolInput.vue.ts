import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';

@Component({})
export default class BoolInput extends BaseInput<boolean, {}> {
  @Prop() readonly value: boolean;
  @Prop() readonly title: string;

  handleClick(e?: MouseEvent) {
    this.emitInput(!this.value, e);
  }
}
