import cx from 'classnames';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import TsxComponent, { createProps } from 'components/tsx-component';
import styles from './HelpTip.m.less';
import { TPlatform } from '../../services/platforms';

class LogoProps {
  platform: TPlatform = 'twitch';
}

@Component({ props: createProps(LogoProps) })
export default class PlatformLogo extends TsxComponent<LogoProps> {

  get iconForPlatform() {
    return {
      twitch: 'fab fa-twitch',
      youtube: 'fab fa-youtube',
      mixer: 'fas fa-times',
      facebook: 'fab fa-facebook',
    }[this.props.platform];

  render() {
    return (
      <i className={cx(styles['platform-icon'], this.iconForPlatform)} />
      )
    );
  }
}
