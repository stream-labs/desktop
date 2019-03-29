import { Component, Prop } from 'vue-property-decorator';
import cx from 'classnames';
import { BaseInput } from './BaseInput';
import { IInputMetadata } from './index';

@Component({})
export default class BoolInput extends BaseInput<boolean, IInputMetadata> {
  @Prop() readonly value: boolean;
  @Prop() readonly title: string;
  @Prop() readonly metadata: IInputMetadata;

  handleClick(e?: MouseEvent) {
    this.emitInput(!this.value, e);
  }

  render(h: Function) {
    return (
      <div
        class={cx('input-wrapper', { disabled: this.options.disabled })}
        data-role="input"
        data-type="bool"
        data-name={this.options.name}
      >
        <div class="checkbox" onClick={this.handleClick}>
          <input type="checkbox" checked={this.value} disabled={this.options.disabled} />
          <label>{this.options.title || '\u00A0' /* nbsp */}</label>
        </div>
      </div>
    );
  }
}
