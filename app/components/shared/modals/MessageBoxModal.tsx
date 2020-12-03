import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import styles from './MessageBoxModal.m.less';
import { WindowsService } from 'services/windows';

@Component({})
export default class MessageBoxModal extends TsxComponent {
  private onCloseClickHandler() {
    WindowsService.hideModal();
  }

  render() {
    return (
      <div class={styles.wrapper}>
        <div class={styles.header}>
          <i class="icon-close" onclick={() => this.onCloseClickHandler()} />
        </div>
        <div class={styles.contentWrapper}>
          <div class={styles.content}>{this.$scopedSlots['default'](null)}</div>
        </div>
      </div>
    );
  }
}
