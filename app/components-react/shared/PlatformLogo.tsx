import React, { HTMLAttributes } from 'react';
import { TPlatform } from '../../services/platforms';
import cx from 'classnames';
import css from './PlatformLogo.m.less';

interface IProps {
  platform: TPlatform | 'nimotv' | 'dlive' | 'streamlabs';
  size?: number;
}

export default function PlatformLogo(p: IProps & HTMLAttributes<unknown>) {
  function iconForPlatform() {
    return {
      twitch: 'fab fa-twitch',
      youtube: 'fab fa-youtube',
      facebook: 'fab fa-facebook',
      dlive: 'dlive',
      nimotv: 'nimotv',
      streamlabs: 'icon-kevin-day',
    }[p.platform];
  }
  const sizeStyle = p.size ? { fontSize: `${p.size}px` } : undefined;
  return <i className={cx(iconForPlatform(), css[p.platform], p.className)} style={sizeStyle} />;
}
