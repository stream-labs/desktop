import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import styles from './Modal.m.less';

/**
 * Shows content above black fade in the middle of the window
 *
 * @Example
 * <Modal>
 *   Loading...
 * </Modal>
 */
@Component({})
export default class Modal extends TsxComponent {
  render() {
    return (
      <div class={styles.wrapper}>
        <div class={styles.fader}></div>
        <div class={styles.content}>{this.$scopedSlots.default({})}</div>
      </div>
    );
  }
}
