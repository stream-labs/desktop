import cx from 'classnames';
import { Component } from 'vue-property-decorator';
import TsxComponent, { createProps } from 'components/tsx-component';
import styles from './PlatformLogo.m.less';
import { TPlatform } from 'services/platforms';

class LogoProps {
  platform: TPlatform | 'nimotv' | 'dlive' = 'twitch';
  size?: number = 0;
}

@Component({ props: createProps(LogoProps) })
export default class PlatformLogo extends TsxComponent<LogoProps> {
  get iconForPlatform() {
    return {
      twitch: 'fab fa-twitch',
      youtube: 'fab fa-youtube',
      mixer: 'fas fa-times',
      facebook: 'fab fa-facebook',
      dlive: 'dlive',
      nimotv: 'nimotv',
    }[this.props.platform];
  }

  render() {
    return (
      <i
        class={cx(this.iconForPlatform, styles[this.props.platform])}
        style={this.props.size && `font-size: ${this.props.size}px`}
      />
    );
  }
}
