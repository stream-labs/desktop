import React, { ReactNode } from 'react';
import { useVuex } from '../hooks';
import { Services } from '../service-provider';
import { getOS, OS } from '../../util/operating-systems';
import classNames from 'classnames';
import { $t } from '../../services/i18n';
import css from './ModalLayout.m.less';

export interface IModalLayoutProps {
  hasTitleBar?: boolean;
  showControls?: boolean;
  showDone?: boolean;
  disableDone?: boolean;
  onSubmit?: (...args: unknown[]) => unknown;
}
type TProps = IModalLayoutProps & { children: ReactNode };

/**
 * A modal layout for showing dialogs
 */
export function ModalLayout(partialProps: TProps) {
  // inject services
  const { WindowsService, CustomizationService } = Services;

  // define default props
  const props = {
    hasTitleBar: true,
    showCancel: true,
    showControls: true,
    showDone: true,
    onSubmit: () => {},
    ...partialProps,
  };

  // define a reactive state
  const state = useVuex(() => ({ currentTheme: CustomizationService.currentTheme }));

  // calculate classnames for a wrapper
  const wrapperClassNames = classNames({
    [css.modalLayout]: true,
    [state.currentTheme]: true,
    [css.hasTitlebar]: props.hasTitleBar,
    [css.modalLayoutMac]: getOS() === OS.Mac,
  });

  // define a close method for the modal
  function close() {
    WindowsService.actions.closeChildWindow();
  }

  // pick variables for the template
  const { showControls, showCancel, children, showDone, disableDone, onSubmit } = props;

  // render template
  return (
    <div className={wrapperClassNames}>
      {/* CONTENT */}
      <div className={css.modalLayoutContent}>{children}</div>

      {/* CONTROLS */}
      {showControls && (
        <div className={css.modalLayoutControls}>
          {showCancel && (
            <button className="button button--default" onClick={close}>
              {$t('Cancel')}
            </button>
          )}
          {showDone && (
            <button disabled={disableDone} className="button button--action" onClick={onSubmit}>
              {$t('Done')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
