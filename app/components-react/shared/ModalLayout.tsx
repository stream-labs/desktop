import React, { ReactNode } from 'react';
import { useVuex } from '../hooks';
import { Services } from '../service-provider';
import { getOS, OS } from '../../util/operating-systems';
import classNames from 'classnames';
import { IModalLayoutProps } from '../../components/shared/react-component-props';
import { $t } from '../../services/i18n';
import css from './ModalLayout.m.less';

type TProps = IModalLayoutProps & { children: ReactNode };

export function ModalLayout(partialProps: TProps) {
  const props = { hasTitleBar: true, showCancel: true, showControls: true, ...partialProps };
  const state = useVuex(() => ({ currentTheme: Services.CustomizationService.currentTheme }));
  const wrapperClassNames = classNames({
    [css.modalLayout]: true,
    [state.currentTheme]: true,
    [css.hasTitlebar]: props.hasTitleBar,
    [css.modalLayoutMac]: getOS() === OS.Mac,
  });
  const { showControls, showCancel, children } = props;

  return (
    <div className={wrapperClassNames}>
      <div className={css.modalLayoutContent}>{children}</div>
      {showControls && (
        <div className={css.modalLayoutControls}>
          {showCancel && <button className="button button--default">{$t('Cancel')}</button>}
        </div>
      )}
    </div>
  );
}
