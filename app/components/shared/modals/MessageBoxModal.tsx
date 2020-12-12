import { Component } from 'vue-property-decorator';
import TsxComponent, { createProps } from 'components/tsx-component';
import styles from './MessageBoxModal.m.less';
import { WindowsService } from 'services/windows';

class Props {
  padding = {
    top: 20,
    right: 20,
    bottom: 40,
    left: 20,
  };
}

/**
 * A MessageBox layout
 * Should be used as an alternative for `window.alert()`
 */
@Component({ props: createProps(Props) })
export default class MessageBoxModal extends TsxComponent<Props> {
  private onCloseClickHandler() {
    WindowsService.hideModal();
  }

  render() {
    return (
      <div class={styles.wrapper}>
        <div class={styles.header}>
          <i class="icon-close" onclick={() => this.onCloseClickHandler()} />
        </div>
        <div
          class={styles.contentWrapper}
          style={{
            paddingTop: `${this.props.padding.top}px`,
            paddingRight: `${this.props.padding.right}px`,
            paddingBottom: `${this.props.padding.bottom}px`,
            paddingLeft: `${this.props.padding.left}px`,
          }}
        >
          <div class={styles.content}>{this.$scopedSlots['default'](null)}</div>
        </div>
      </div>
    );
  }
}
