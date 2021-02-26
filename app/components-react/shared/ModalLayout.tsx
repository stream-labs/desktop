import React, { ReactNode, CSSProperties } from 'react';
import { useOnCreate, useVuex } from '../hooks';
import { Services } from '../service-provider';
import { getOS, OS } from '../../util/operating-systems';
import cx from 'classnames';
import { $t } from '../../services/i18n';
import { Button } from 'antd';
import { ModalProps } from 'antd/lib/modal';

// use props of Modal from the antd lib
type TProps = { children: ReactNode } & Pick<ModalProps, 'footer' | 'onOk' | 'okText'>;

// calculate OS dependent styles
const titleHeight = getOS() === OS.Mac ? 22 : 30;
const footerHeight = 53;
const wrapperStyles: CSSProperties = {
  height: `calc(100% - ${titleHeight}px)`,
};
const bodyStyles: CSSProperties = {
  height: `calc(100% - ${footerHeight}px)`,
};

/**
 * Wraps content for the child windows
 */
export function ModalLayout(p: TProps) {
  // inject services
  const { WindowsService, CustomizationService } = Services;

  // define a vuex state
  const v = useVuex(() => ({ currentTheme: CustomizationService.currentTheme }));

  // define a close method for the modal
  function close() {
    WindowsService.actions.closeChildWindow();
  }

  // render a default footer with action buttons
  function renderDefaultFooter() {
    const okText = p.okText && $t('Done');
    return (
      <>
        <Button onClick={close}>{$t('Close')}</Button>
        {p.onOk && (
          <Button onClick={p.onOk} type="primary">
            {okText}
          </Button>
        )}
      </>
    );
  }

  return (
    <div className={cx('ant-modal-content', v.currentTheme)} style={wrapperStyles}>
      <div className="ant-modal-body" style={bodyStyles}>
        {p.children}
      </div>
      <div className="ant-modal-footer">{p.footer || renderDefaultFooter()}</div>
    </div>
  );
}
