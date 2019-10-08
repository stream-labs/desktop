import cx from 'classnames';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { DismissablesService, EDismissable } from 'services/dismissables';
import TsxComponent, { createProps } from 'components/tsx-component';
import styles from './HelpTip.m.less';

class HelpTipProps {
  dismissableKey: EDismissable = null;
  position: {
    top?: string;
    left?: string;
    bottom?: string;
    right?: string;
  } = {};
  tipPosition?: 'left' | 'right' = 'left';
}

@Component({ props: createProps(HelpTipProps) })
export default class HelpTip extends TsxComponent<HelpTipProps> {
  @Inject() dismissablesService: DismissablesService;

  get shouldShow() {
    return this.dismissablesService.shouldShow(this.props.dismissableKey);
  }

  closeHelpTip() {
    this.dismissablesService.dismiss(this.props.dismissableKey);
  }

  render() {
    return (
      this.shouldShow && (
        <div class={styles.helpTip} style="position">
          <div
            class={cx(styles.helpTipArrow, {
              [styles.helpTipArrowRight]: this.props.tipPosition === 'right',
            })}
          />
          <i onClick={this.closeHelpTip} class={cx(styles.helpTipClose, 'icon-close')} />
          <div class={styles.helpTipTitle}>
            <i class="fa fa-info-circle" />
            <slot name="title" />
          </div>
          <div class={styles.helpTipBody}>
            <slot name="content" />
          </div>
        </div>
      )
    );
  }
}
