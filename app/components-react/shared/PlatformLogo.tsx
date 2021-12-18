import React, { HTMLAttributes } from 'react';
import { TPlatform } from '../../services/platforms';
import cx from 'classnames';
import css from './PlatformLogo.m.less';
import KevinSvg from './KevinSvg';

const sizeMap = {
  medium: 40,
};

interface IProps {
  platform: TPlatform | 'nimotv' | 'dlive' | 'streamlabs';
  size?: keyof typeof sizeMap | number;
  color?: string;
  unwrapped?: boolean;
}

export default function PlatformLogo(p: IProps & HTMLAttributes<unknown>) {
  function iconForPlatform() {
    return {
      twitch: 'fab fa-twitch',
      youtube: 'fab fa-youtube',
      facebook: 'fab fa-facebook',
      tiktok: 'fab fa-tiktok',
      trovo: 'fab fa-trovo',
      dlive: 'dlive',
      nimotv: 'nimotv',
      streamlabs: 'icon-streamlabs',
    }[p.platform];
  }
  const size = p.size && (sizeMap[p.size] ?? p.size);
  const sizeStyle = size ? { fontSize: `${size}px` } : undefined;
  const colorStyle = p.color ? { color: p.color } : undefined;
  const style = { ...sizeStyle, ...colorStyle };
  return <i className={cx(iconForPlatform(), css[p.platform], p.className)} style={style} />;
}
