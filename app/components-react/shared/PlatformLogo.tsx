import React, { HTMLAttributes } from 'react';
import { TPlatform } from '../../services/platforms';
import cx from 'classnames';
import css from './PlatformLogo.m.less';

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
  if (p.platform === 'tiktok') return TikTokLogo(p);
  return GenericLogo(p);
}

function GenericLogo(p: IProps & HTMLAttributes<unknown>) {
  function iconForPlatform() {
    return {
      twitch: 'fab fa-twitch',
      youtube: 'fab fa-youtube',
      facebook: 'fab fa-facebook',
      tiktok: 'tiktok',
      dlive: 'dlive',
      nimotv: 'nimotv',
      streamlabs: 'icon-kevin-day',
    }[p.platform];
  }
  const size = p.size && (sizeMap[p.size] ?? p.size);
  const sizeStyle = size ? { fontSize: `${size}px` } : undefined;
  const colorStyle = p.color ? { color: p.color } : undefined;
  const style = { ...sizeStyle, ...colorStyle };
  return <i className={cx(iconForPlatform(), css[p.platform], p.className)} style={style} />;
}

function getTikTokSvg(color: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" style="height: 100%;" viewBox="0 0 448 512"><!-- Font Awesome Free 5.15.3 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) --><path fill="${color}" d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/></svg>`;
}

function TikTokLogo(p: IProps) {
  const color = 'black';
  const size = (p.size && (sizeMap[p.size] ?? p.size)) ?? 40;

  const wrapperStyles = {
    backgroundColor: 'white',
    borderRadius: '50%',
    display: 'flex',
    width: `${size}px`,
    height: `${size}px`,
    alignItems: 'center',
    justifyContent: 'center',
  };

  if (p.unwrapped) {
    return (
      <i
        className="fab tiktok"
        style={{ width: `${size}px`, height: `${size}px` }}
        dangerouslySetInnerHTML={{ __html: getTikTokSvg(color) }}
      />
    );
  }

  return (
    <div style={wrapperStyles}>
      <i
        className="fab tiktok"
        style={{ width: `${size * 0.6}px` }}
        dangerouslySetInnerHTML={{ __html: getTikTokSvg(color) }}
      />
    </div>
  );
}
