import React from 'react';
import { Button, ButtonProps } from 'antd';
import cx from 'classnames';
import { TPlatform } from '../../services/platforms';
import KevinSvg from './KevinSvg';
import PlatformLogo from './PlatformLogo';
import styles from './PlatformButton.m.less';

interface PlatformButtonProps extends ButtonProps {
  className?: string;
  platform: 'streamlabs' | TPlatform /* TODO: no logo | 'paypal' */;
  onClick: () => void;
}

export default function PlatformButton({
  platform,
  className,
  children,
  onClick,
}: PlatformButtonProps) {
  const logoProps = platform === 'streamlabs' ? { color: 'black' } : {};

  return (
    <Button
      size="large"
      type="link"
      className={cx([styles.button, styles[`platform-button--${platform}`], className])}
      onClick={onClick}
    >
      <PlatformLogo platform={platform} className={styles.platformIcon} {...logoProps} />
      {children}
      <i className={cx('fa fa-arrow-right', styles.arrowIcon)} aria-hidden="true"></i>
    </Button>
  );
}
