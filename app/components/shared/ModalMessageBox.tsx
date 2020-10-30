import { Component } from 'vue-property-decorator';
import TsxComponent, { createProps } from 'components/tsx-component';
import styles from './ModalMessageBox.m.less';

class Props {
  name = '';
  height? = 150;
}
@Component({ props: createProps(Props) })
export default class ModalMessageBox extends TsxComponent<Props> {
  private onCloseClickHandler() {
    this.$modal.hide(this.props.name);
  }

  render() {
    return (
      <modal name={this.props.name} height={this.props.height}>
        <div class={styles.header}>
          <i class="icon-close" onclick={() => this.onCloseClickHandler()} />
        </div>
        <div class={styles.content}>{this.$scopedSlots['default'](null)}</div>
      </modal>
    );
  }
}
