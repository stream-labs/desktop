import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';

@Component({})
export default class BoolInput extends BaseInput<boolean, { name: string; title: string }> {
  @Prop() readonly value: boolean;
  @Prop() readonly title: string;

  handleClick(e?: MouseEvent) {
    this.emitInput(!this.value, e);
  }

  render(h: Function) {
    return (
      <div class="input-wrapper" data-role="input" data-type="bool" data-name={this.options.name}>
        <div class="checkbox" onClick={this.handleClick}>
          <input type="checkbox" checked={this.value} />
          <label>{this.options.title || '&nbsp;'}</label>
        </div>
      </div>
    );
  }
}
