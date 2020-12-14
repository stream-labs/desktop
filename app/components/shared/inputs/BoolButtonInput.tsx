import { Component, Prop } from 'vue-property-decorator';
import cx from 'classnames';
import { BaseInput } from './BaseInput';
import { IInputMetadata } from './index';
import styles from './BoolButtonInput.m.less';

@Component({})
export default class BoolInput extends BaseInput<boolean, IInputMetadata> {
  @Prop() readonly value: boolean;
  @Prop() readonly title: string;
  @Prop() readonly metadata: IInputMetadata;

  handleClick(e?: MouseEvent) {
    if (this.options.disabled) return;
    this.emitInput(!this.value, e);
  }

  render() {
    return (
      <div
        class={cx('input-wrapper', { disabled: this.options.disabled })}
        data-role="input"
        data-type="toggle"
        data-value={this.value}
        data-name={this.options.name}
      >
        <div
          class={cx(styles.boolButton, { [styles.active]: this.value })}
          onClick={() => this.handleClick()}
        >
          {this.options.title || '\u00A0' /* nbsp */}
        </div>
        {this.options.tooltip && (
          <i
            style="margin-left: 8px"
            class="icon-question icon-btn"
            v-tooltip={this.options.tooltip}
          />
        )}
      </div>
    );
  }
}
