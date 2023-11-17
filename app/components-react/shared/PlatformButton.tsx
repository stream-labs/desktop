import React from 'react';
import { Button, ButtonProps } from 'antd';
import cx from 'classnames';
import { EPlatform, TPlatform } from '../../services/platforms';
import PlatformLogo from './PlatformLogo';
import styles from './PlatformButton.m.less';

interface PlatformButtonProps extends ButtonProps {
  className?: string;
  platform: 'streamlabs' | TPlatform /* TODO: no logo | 'paypal' */;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

interface PlatformIconButtonProps {
  platform?: TPlatform;
  logo?: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const loadingIcon = <i className="fas fa-spinner fa-spin" />;

export const PlatformIconButton = ({
  platform,
  logo,
  title,
  onClick,
  disabled,
  loading,
}: PlatformIconButtonProps) => {
  const icon = platform ? (
    <PlatformLogo platform={platform} className={styles.platformIcon} />
  ) : (
    <img src={logo}></img>
  );

  return (
    <Button
      className={cx(styles.platformIconButton, platform ? `platform-icon-button--${platform}` : '')}
      onClick={onClick}
      disabled={disabled}
      icon={loading ? loadingIcon : icon}
      title={title}
    />
  );
};

export default function PlatformButton({
  disabled = false,
  loading = false,
  platform,
  className,
  children,
  onClick,
}: PlatformButtonProps) {
  // TODO: use loading indicator, it's causing relayout issues atm
  const logoProps = platform === 'streamlabs' ? { color: 'black' } : {};

  return (
    <Button
      size="large"
      className={cx([styles.platformButton, styles[`platform-button--${platform}`], className])}
      onClick={onClick}
      disabled={disabled}
    >
      <PlatformLogo platform={platform} className={styles.platformIcon} {...logoProps} />
      {children}
      <i className={cx('fa fa-arrow-right', styles.arrowIcon)} aria-hidden="true"></i>
    </Button>
  );
}
