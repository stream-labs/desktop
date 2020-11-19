import TsxComponent, { createProps } from 'components/tsx-component';
import { $t } from 'services/i18n';
import { Component } from 'vue-property-decorator';
import styles from './GoLiveError.m.less';
import cx from 'classnames';
import { IStreamError } from 'services/streaming/stream-error';

class ErrorLayoutProps {
  error?: IStreamError = undefined;
  /**
   * overrides the error message if provided
   */
  message?: string = '';
  type?: 'error' | 'success' = 'error';
}

/**
 * Layout for displaying an single error
 */
@Component({ props: createProps(ErrorLayoutProps) })
export default class ErrorLayout extends TsxComponent<ErrorLayoutProps> {
  private isErrorDetailsShown = false;

  private render() {
    const error = this.props.error;
    const message = this.props.message || error?.message;
    const details = error?.details;
    const type = this.props.type;
    return (
      <div
        class={cx(
          'section selectable',
          styles.container,
          type === 'error' ? styles.container_error : styles.container_success,
        )}
      >
        <p class={styles.title}>
          <i class="fa fa-warning" /> {message}
        </p>
        <p>{this.$slots.default}</p>

        {details && !this.isErrorDetailsShown && (
          <p style={{ textAlign: 'right' }}>
            <a class={styles.link} onclick={() => (this.isErrorDetailsShown = true)}>
              {$t('Show details')}
            </a>
          </p>
        )}
        {details && this.isErrorDetailsShown && <p class={styles.details}>{details}</p>}
      </div>
    );
  }
}
