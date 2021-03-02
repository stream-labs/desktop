import { Services } from './service-provider';
import { Modal, Button } from 'antd';
import Utils from '../services/utils';
import { ModalFuncProps } from 'antd/lib/modal';
import { $t } from '../services/i18n';

/**
 * Show an Confirmation modal and return a Promise<confirmed: boolean>
 * Uses Modal.confirm under the hood
 *
 * @example
 * confirm('Confirm me')
 * .then(confirmed => console.log(confirmed ? 'Confirmed' : 'Canceled'))
 *
 */
export function confirm(
  p: Omit<ModalFuncProps, 'afterClose' | 'onOk' | 'onCancel'> | string,
): Promise<boolean> {
  const { WindowsService } = Services;
  const modalProps = typeof p === 'string' ? { title: p } : p;
  WindowsService.updateStyleBlockers(Utils.getWindowId(), true);
  return new Promise(resolve => {
    Modal.confirm({
      ...modalProps,
      afterClose: () => {
        WindowsService.updateStyleBlockers(Utils.getWindowId(), false);
      },
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
}

/**
 * The asynchronous version of Windows.alert
 * Uses Modal.info under the hood
 * @example
 * alert('This is Alert').then(() => console.log('Alert closed'))
 *
 */
export function alert(p: Omit<ModalFuncProps, 'afterClose'> | string): Promise<void> {
  const modalProps = typeof p === 'string' ? { title: p } : p;
  const { WindowsService } = Services;
  WindowsService.updateStyleBlockers(Utils.getWindowId(), true);
  return new Promise(resolve => {
    Modal.confirm({
      ...modalProps,
      cancelButtonProps: { style: { display: 'none' } },
      okButtonProps: { type: 'default' },
      okText: $t('Close'),
      afterClose: () => {
        WindowsService.updateStyleBlockers(Utils.getWindowId(), false);
        resolve();
      },
    });
  });
}
