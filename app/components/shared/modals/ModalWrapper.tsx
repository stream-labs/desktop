import { Component } from 'vue-property-decorator';
import TsxComponent, { createProps } from 'components/tsx-component';
import { IModalOptions } from 'services/windows';

class Props implements IModalOptions {
  renderFn: Function | null = null;
}

/**
 * Shows an animated modal
 */
@Component({ props: createProps(Props) })
export default class ModalWrapper extends TsxComponent<Props> {
  render() {
    return (
      <div style={{ position: 'absolute' }}>
        <transition name="fade">{this.props?.renderFn && this.props.renderFn()}</transition>
      </div>
    );
  }
}
