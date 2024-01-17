import React, { HTMLAttributes } from 'react';
import { TPlatform } from '../../services/platforms';
import cx from 'classnames';
import css from './PlatformLogo.m.less';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';

const sizeMap = {
  small: 14,
  medium: 40,
};

interface IProps {
  platform: TPlatform | 'nimotv' | 'dlive' | 'instagram' | 'streamlabs';
  size?: keyof typeof sizeMap | number;
  color?: string;
  nocolor?: boolean;
  unwrapped?: boolean;
  trovo?: boolean;
}

export default function PlatformLogo(p: IProps & HTMLAttributes<unknown>) {
  const { CustomizationService } = Services;
  const { isDark } = useVuex(() => {
    return {
      isDark: CustomizationService.views.isDarkTheme,
    };
  });

  function iconForPlatform() {
    return {
      twitch: 'fab fa-twitch',
      youtube: 'fab fa-youtube',
      facebook: 'fab fa-facebook',
      tiktok: 'fab fa-tiktok',
      trovo: 'fab fa-trovo',
      dlive: 'dlive',
      nimotv: 'nimotv',
      twitter: 'twitter',
      streamlabs: 'icon-streamlabs',
      instagram: 'fab fa-instagram',
    }[p.platform];
  }
  const size = p.size && (sizeMap[p.size] ?? p.size);
  const sizeStyle = size
    ? { fontSize: `${size}px`, maxHeight: `${size}px`, maxWidth: `${size}px` }
    : undefined;
  const colorStyle = p.color ? { color: p.color } : undefined;
  const style = { ...sizeStyle, ...colorStyle };

  let color = p.color;

  // This might be a hack - but handle twitter logo for different themes
  if (p.platform === 'twitter' && !isDark) {
    color = 'black';
  }

  return (
    <>
      {p.trovo ? (
        <i className={cx('icon-trovo', p.className)} />
      ) : (
        <i
          className={cx(iconForPlatform(), !p.nocolor && css[p.platform], p.className, {
            // Trovo doesn't provide an SVG, so just use different colored PNGs
            [css['trovo--black']]: p.platform === 'trovo' && p.color === 'black',
            [css['twitter--black']]: p.platform === 'twitter' && color === 'black',
          })}
          style={style}
        />
      )}
    </>
  );
}
