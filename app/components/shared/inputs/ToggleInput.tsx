import cx from 'classnames';
import styles from './ToggleInput.m.less';
import { Component } from 'vue-property-decorator';
import BoolInput from './BoolInput';

@Component({})
export default class ToggleInput extends BoolInput {
  render(h: Function) {
    return (
      <div
        onClick={this.handleClick}
        class={cx(styles.toggleinputContainer, { [styles.active]: this.value })}
      >
        <div class={styles.toggleinputTrack} />
        <div class={styles.toggleinputHandle} />
      </div>
    );
  }
}
