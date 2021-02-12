import React from 'react';
import { getPlatformService, TPlatform } from '../../../services/platforms';
import cx from 'classnames';
import { $t } from '../../../services/i18n';
import styles from './DestinationSwitchers.m.less';
import { ICustomStreamDestination } from '../../../services/settings/streaming';
import { Services } from '../../service-provider';
import { SwitchInput } from '../../shared/inputs';
import PlatformLogo from '../../shared/PlatformLogo';

type TPlatforms = Record<TPlatform, { enabled: boolean }>;

interface IProps {
  title?: string;
  platforms: TPlatforms;
  customDestinations?: ICustomStreamDestination[];

  /**
   * allow to disable the primary platform
   * we can disable primary platform in the ScheduleStream window
   */
  canDisablePrimary: boolean;
  onPlatformSwitch: (platform: TPlatform, enabled: boolean) => unknown;
  onCustomDestSwitch?: (destInd: number, enabled: boolean) => unknown;
}

/**
 * Allows enabling/disabling platforms for the stream
 */
export function DestinationSwitchers(p: IProps) {
  const { StreamingService, UserService } = Services;
  const view = StreamingService.views;
  const platforms = view.sortPlatforms(Object.keys(p.platforms) as TPlatform[]);

  function render() {
    return (
      <div>
        {platforms.map((platform: TPlatform) => renderPlatform(platform))}
        {p.customDestinations?.map((dest, ind) => renderCustomDestination(dest, ind))}
      </div>
    );
  }

  /**
   * Renders a switcher for a custom destination
   */
  function renderCustomDestination(dest: ICustomStreamDestination, ind: number) {
    const enabled = dest.enabled;
    return (
      <div
        key={`custom-dest-${ind}`}
        className={cx(styles.platformSwitcher, { [styles.platformDisabled]: !enabled })}
        onClick={() => p.onCustomDestSwitch && p.onCustomDestSwitch(ind, !enabled)}
      >
        {/* TOGGLE INPUT */}
        <div className={cx(styles.colInput)}>{/*<ToggleInput value={enabled} />*/}</div>

        {/* DEST LOGO */}
        <div className="logo margin-right--20">
          <i className={cx(styles.destinationLogo, 'fa fa-globe')} />
        </div>

        {/* DESTINATION NAME AND URL */}
        <div className={styles.colAccount}>
          <span className={styles.platformName}>{dest.name}</span> <br />
          {dest.url} <br />
        </div>
      </div>
    );
  }

  /**
   * Renders a single platform switcher
   */
  function renderPlatform(platform: TPlatform) {
    const destination = p.platforms[platform];
    const enabled = destination.enabled;
    const isPrimary = view.isPrimaryPlatform(platform);
    const platformService = getPlatformService(platform);
    const platformName = platformService.displayName;
    const username = UserService.state.auth?.platforms[platform]!.username;
    const title = p.title ? $t(p.title, { platformName }) : platformName;
    const canDisablePrimary = p.canDisablePrimary;

    return (
      <div
        key={platform}
        className={cx(styles.platformSwitcher, { [styles.platformDisabled]: !enabled })}
        onClick={() => p.onPlatformSwitch(platform, !enabled)}
      >
        <div className={cx(styles.colInput)}>
          {/*TODO:*/}
          {/*{isPrimary && !canDisablePrimary ? (*/}
          {/*  <span*/}
          {/*    vTooltip={$t(*/}
          {/*      'You cannot disable the platform you used to sign in to Streamlabs OBS. Please sign in with a different platform to disable streaming to this destination.',*/}
          {/*    )}*/}
          {/*  >*/}
          {/*    <ToggleInput value={enabled} metadata={{ name: platform }} />*/}
          {/*  </span>*/}
          {/*) : (*/}
          {/*  <ToggleInput value={enabled} metadata={{ name: platform }} />*/}
          {/*)}*/}
          <SwitchInput value={enabled} name={platform} />
        </div>

        {/* PLATFORM LOGO */}
        <div className="logo margin-right--20">
          <PlatformLogo platform={platform} className={styles[`platform-logo-${platform}`]} />
        </div>

        {/* PLATFORM TITLE AND ACCOUNT */}
        <div className={styles.colAccount}>
          <span className={styles.platformName}>{title}</span> <br />
          {username} <br />
        </div>
      </div>
    );
  }

  return render();
}
