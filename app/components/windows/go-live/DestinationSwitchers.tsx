import TsxComponent, { createProps } from 'components/tsx-component';
import { getPlatformService, TPlatform } from '../../../services/platforms';
import { Component } from 'vue-property-decorator';
import { ToggleInput } from '../../shared/inputs/inputs';
import PlatformLogo from '../../shared/PlatformLogo';
import { Inject } from '../../../services/core';
import { UserService } from '../../../services/user';
import cx from 'classnames';
import { $t } from 'services/i18n';
import styles from './DestinationSwitchers.m.less';
import { StreamingService } from 'services/streaming';
import { ICustomStreamDestination } from '../../../services/settings/streaming';

type TPlatforms = Record<TPlatform, { enabled: boolean }>;

class Props {
  title?: string = '';
  platforms: TPlatforms = undefined;
  customDestinations?: ICustomStreamDestination[] = undefined;

  /**
   * allow to disable the primary platform
   * we can disable primary platform in the ScheduleStream window
   */
  canDisablePrimary: boolean = false;
  handleOnPlatformSwitch?: (platform: TPlatform, enabled: boolean) => unknown = () => null;
  handleOnCustomDestSwitch?: (destInd: number, enabled: boolean) => unknown = () => null;
}

/**
 * Allows enabling/disabling platforms for the stream
 */
@Component({ props: createProps(Props) })
export class DestinationSwitchers extends TsxComponent<Props> {
  @Inject() private streamingService: StreamingService;
  @Inject() private userService: UserService;

  private get view() {
    return this.streamingService.views;
  }

  private onSwitchPlatformHandler(platform: TPlatform, enabled: boolean) {
    if (this.view.isPrimaryPlatform(platform)) return;
    this.props.handleOnPlatformSwitch && this.props.handleOnPlatformSwitch(platform, enabled);
  }

  private onSwitchCustomDestHandler(destInd: number, enabled: boolean) {
    this.props.handleOnCustomDestSwitch && this.props.handleOnCustomDestSwitch(destInd, enabled);
  }

  /**
   * Renders a list of switchers
   */
  private render() {
    const platforms = this.view.sortPlatforms(Object.keys(this.props.platforms) as TPlatform[]);
    return (
      <div>
        {platforms.map((platform: TPlatform) => this.renderPlatform(platform))}
        {this.props.customDestinations?.map((dest, ind) => this.renderCustomDestination(dest, ind))}
      </div>
    );
  }

  /**
   * Renders a single platform switcher
   */
  private renderPlatform(platform: TPlatform) {
    const destination = this.props.platforms[platform];
    const enabled = destination.enabled;
    const isPrimary = this.view.isPrimaryPlatform(platform);
    const platformService = getPlatformService(platform);
    const platformName = platformService.displayName;
    const username = this.userService.state.auth?.platforms[platform]!.username;
    const title = this.props.title ? $t(this.props.title, { platformName }) : platformName;

    // don't show toggle inputs if we have only one platform to stream
    const shouldShowToggles =
      Object.keys(this.props.platforms).length > 1 || this.props.customDestinations?.length > 0;
    return (
      <div
        class={cx(styles.platformSwitcher, { [styles.platformDisabled]: !enabled })}
        onClick={() => this.onSwitchPlatformHandler(platform, !enabled)}
      >
        {/* TOGGLE INPUT */}
        {shouldShowToggles && (
          <div class={cx(styles.colInput)}>
            {isPrimary ? (
              <span
                vTooltip={$t(
                  'You cannot disable the platform you used to sign in to Streamlabs OBS. Please sign in with a different platform to disable streaming to this destination.',
                )}
              >
                <ToggleInput value={enabled} metadata={{ disabled: true, name: platform }} />
              </span>
            ) : (
              <ToggleInput value={enabled} metadata={{ disabled: true, name: platform }} />
            )}
          </div>
        )}

        {/* PLATFORM LOGO */}
        <div class="logo margin-right--20">
          <PlatformLogo platform={platform} class={styles[`platform-logo-${platform}`]} />
        </div>

        {/* PLATFORM TITLE AND ACCOUNT */}
        <div class={styles.colAccount}>
          <span class={styles.platformName}>{title}</span> <br />
          {username} <br />
        </div>
      </div>
    );
  }

  /**
   * Renders a switcher for a custom destination
   */
  private renderCustomDestination(dest: ICustomStreamDestination, ind: number) {
    const enabled = dest.enabled;
    return (
      <div
        class={cx(styles.platformSwitcher, { [styles.platformDisabled]: !enabled })}
        onClick={() => this.onSwitchCustomDestHandler(ind, !enabled)}
      >
        {/* TOGGLE INPUT */}
        <div class={cx(styles.colInput)}>
          <ToggleInput value={enabled} />
        </div>

        {/* DEST LOGO */}
        <div class="logo margin-right--20">
          <i class={cx(styles.destinationLogo, 'fa fa-globe')} />
        </div>

        {/* DESTINATION NAME AND URL */}
        <div class={styles.colAccount}>
          <span class={styles.platformName}>{dest.name}</span> <br />
          {dest.url} <br />
        </div>
      </div>
    );
  }
}
