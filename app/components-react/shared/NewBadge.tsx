import React, { CSSProperties } from 'react';
import styles from './NewBadge.m.less';
import { EDismissable } from 'services/dismissables';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import cx from 'classnames';
import { $t } from 'services/i18n';

interface INewButtonProps {
  // children is a special React property which allows access any child elements including text
  children?: string;

  dismissableKey: EDismissable;
  size?: 'standard' | 'small';
  absolute?: boolean;
  style?: CSSProperties;
}

export default function NewButton({
  children = "",
  dismissableKey,
  size = 'standard',
  absolute = false,
  style,
}: INewButtonProps) {
  const { DismissablesService } = Services;

  const { shouldShow } = useVuex(() => ({
    shouldShow: DismissablesService.views.shouldShow(dismissableKey),
  }));

  if (!shouldShow) return <></>;

  return (
    <div
      className={cx(
        styles.badge,
        styles.newBadge,
        absolute && styles.absolute,
        size === 'small' && styles.small,
      )}
      style={style}
    >
      {children.length !== 0 ? $t(children) : $t('New')}
    </div>
  );
}
