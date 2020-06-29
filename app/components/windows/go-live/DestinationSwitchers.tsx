import TsxComponent, { createProps } from 'components/tsx-component';
import { getPlatformService, TPlatform } from '../../../services/platforms';
import { Component } from 'vue-property-decorator';
import { ToggleInput } from '../../shared/inputs/inputs';
import PlatformLogo from '../../shared/PlatformLogo';
import { SyncWithValue } from '../../../services/app/app-decorators';
import { Inject } from '../../../services/core';
import { UserService } from '../../../services/user';
import cx from 'classnames';
import { $t } from 'services/i18n';
import styles from './DestinationSwitchers.m.less';
import { StreamingService } from 'services/streaming';

type TDestinations = Partial<Record<TPlatform, { enabled: boolean }>>;

class Props {
  title?: string = '';
  value?: TDestinations = {};
  canDisablePrimary: boolean = false;
  handleOnSwitch?: (platform: TPlatform, enabled: boolean) => unknown = () => null;
}

/**
 * Renders a list of switchers for the stream destinations
 */
@Component({ props: createProps(Props) })
export class DestinationSwitchers extends TsxComponent<Props> {
  @Inject() private streamingService: StreamingService;
  @Inject() private userService: UserService;
  @SyncWithValue() private destinations: TDestinations = {};

  private get view() {
    return this.streamingService.views;
  }

  private onSwitchHandler(platform: TPlatform, enabled: boolean) {
    if (this.view.isPrimaryPlatform(platform)) return;
    this.destinations[platform].enabled = enabled;
    this.props.handleOnSwitch && this.props.handleOnSwitch(platform, enabled);
  }

  private render() {
    const destinations = this.view.sortPlatforms(Object.keys(this.props.value) as TPlatform[]);
    return <div>{destinations.map((platform: TPlatform) => this.renderDestination(platform))}</div>;
  }

  private renderDestination(platform: TPlatform) {
    const destination = this.destinations[platform];
    const enabled = destination.enabled;
    const isPrimary = this.view.isPrimaryPlatform(platform);
    const platformService = getPlatformService(platform);
    const platformName = platformService.displayName;
    const username = this.userService.state.auth.platforms[platform].username;
    const title = this.props.title ? $t(this.props.title, { platformName }) : platformName;
    const shouldShowToggle = !isPrimary || this.props.canDisablePrimary;
    const shouldShowNotificator = !shouldShowToggle;
    const shouldShowLeftColumn = Object.keys(this.destinations).length > 1;
    return (
      <div
        class={cx(styles.platformSwitcher, { [styles.platformDisabled]: !enabled })}
        onClick={() => this.onSwitchHandler(platform, !enabled)}
      >
        {shouldShowLeftColumn && (
          <div class={cx(styles.colInput, isPrimary && styles.colPrimary)}>
            {shouldShowNotificator && (
              <i
                class="fa fa-info-circle"
                vTooltip={$t(
                  'You cannot disable the platform you used to sign in to Streamlabs OBS. Please sign in with a different platform to disable streaming to this destination.',
                )}
              />
            )}
            {shouldShowToggle && <ToggleInput value={enabled} />}
          </div>
        )}
        <div class="logo margin-right--20">
          <PlatformLogo platform={platform} class={styles[`platform-logo-${platform}`]} />
        </div>
        <div class="account">
          <span class={styles.platformName}>{title}</span> <br />
          {username} <br />
        </div>
      </div>
    );
  }
}
