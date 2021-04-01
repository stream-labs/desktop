import React, { useRef, MouseEvent } from 'react';
import { getPlatformService, TPlatform } from '../../../services/platforms';
import cx from 'classnames';
import { $t } from '../../../services/i18n';
import styles from './DestinationSwitchers.m.less';
import { ICustomStreamDestination } from '../../../services/settings/streaming';
import { Services } from '../../service-provider';
import { InputComponent, SwitchInput } from '../../shared/inputs';
import PlatformLogo from '../../shared/PlatformLogo';
import Utils, { keys } from '../../../services/utils';
import { TSwitchInputProps } from '../../shared/inputs/SwitchInput';
import { assertIsDefined } from '../../../util/properties-type-guards';
import { useDebounce, useFormState } from '../../hooks';
import pick from 'lodash/pick';
import { useGoLiveSettings } from './useGoLiveSettings';
import { mapValues, values } from 'lodash';
import { Tooltip } from 'antd';
import { alertAsync } from '../../modals';

/**
 * Allows enabling/disabling platforms and custom destinations for the stream
 */
export function DestinationSwitchers() {
  const {
    linkedPlatforms,
    enabledPlatforms,
    customDestinations,
    switchPlatforms,
    switchCustomDestination,
    checkPrimaryPlatform,
  } = useGoLiveSettings();

  const enabledPlatformsRef = useRef(enabledPlatforms);

  const emitSwitch = useDebounce(500, () => {
    switchPlatforms(enabledPlatformsRef.current);
  });

  function isEnabled(platform: TPlatform) {
    return enabledPlatformsRef.current.includes(platform);
  }

  function togglePlatform(platform: TPlatform, enabled: boolean) {
    enabledPlatformsRef.current = enabledPlatformsRef.current.filter(p => p !== platform);
    if (enabled) enabledPlatformsRef.current.push(platform);
    emitSwitch();
  }

  return (
    <div>
      {linkedPlatforms.map(platform => (
        <DestinationSwitcher
          key={platform}
          destination={platform}
          enabled={isEnabled(platform)}
          onChange={enabled => togglePlatform(platform, enabled)}
          isPrimary={checkPrimaryPlatform(platform)}
        />
      ))}
      {customDestinations?.map((dest, ind) => (
        <DestinationSwitcher
          key={ind}
          destination={dest}
          enabled={customDestinations[ind].enabled}
          onChange={enabled => switchCustomDestination(ind, enabled)}
        />
      ))}
    </div>
  );
}

interface IDestinationSwitcherProps {
  destination: TPlatform | ICustomStreamDestination;
  enabled: boolean;
  onChange: (enabled: boolean) => unknown;
  isPrimary?: boolean;
}

/**
 * Render a single switcher
 */
function DestinationSwitcher(p: IDestinationSwitcherProps) {
  const switchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const platform = typeof p.destination === 'string' ? (p.destination as TPlatform) : null;

  function onClickHandler(ev: MouseEvent) {
    if (p.isPrimary) {
      alertAsync(
        $t(
          'You cannot disable the platform you used to sign in to Streamlabs OBS. Please sign in with a different platform to disable streaming to this destination.',
        ),
      );
      return;
    }
    const enable = !p.enabled;
    p.onChange(enable);
    // always proxy the click to the SwitchInput
    // so it can play a transition animation
    switchInputRef.current?.click();
    // switch the container class without re-rendering to not stop the animation
    if (enable) {
      containerRef.current?.classList.remove(styles.platformDisabled);
    } else {
      containerRef.current?.classList.add(styles.platformDisabled);
    }
  }

  const { title, description, Switch, Logo } = (() => {
    if (platform) {
      // define slots for a platform switcher
      const { UserService } = Services;
      const service = getPlatformService(platform);
      const platformAuthData = UserService.state.auth?.platforms[platform];
      assertIsDefined(platformAuthData);
      return {
        title: $t('Stream to %{platformName}', { platformName: service.displayName }),
        description: platformAuthData.username,
        Logo: () => (
          <PlatformLogo platform={platform} className={styles[`platform-logo-${platform}`]} />
        ),
        Switch: () => (
          <SwitchInput
            inputRef={switchInputRef}
            value={p.enabled}
            name={platform}
            disabled={p.isPrimary}
            uncontrolled
          />
        ),
      };
    } else {
      // define slots for a custom destination switcher
      const destination = p.destination as ICustomStreamDestination;
      return {
        title: destination.name,
        description: destination.url,
        Logo: () => <i className={cx(styles.destinationLogo, 'fa fa-globe')} />,
        Switch: () => (
          <SwitchInput
            inputRef={switchInputRef}
            value={destination.enabled}
            name={`destination_${destination.name}`}
            uncontrolled
          />
        ),
      };
    }
  })();

  return (
    <div
      ref={containerRef}
      className={cx(styles.platformSwitcher, { [styles.platformDisabled]: !p.enabled })}
      onClick={onClickHandler}
    >
      <div className={cx(styles.colInput)}>
        <Switch />
      </div>

      {/* PLATFORM LOGO */}
      <div className="logo margin-right--20">
        <Logo />
      </div>

      {/* PLATFORM TITLE AND ACCOUNT/URL */}
      <div className={styles.colAccount}>
        <span className={styles.platformName}>{title}</span> <br />
        {description} <br />
      </div>
    </div>
  );
}

function getPlatformName(platform: TPlatform): string {
  const service = getPlatformService(platform);
  return service.displayName;
}

function getPlatformUsername(platform: TPlatform) {
  const platformAuthData = Services.UserService.state.auth?.platforms[platform];
  assertIsDefined(platformAuthData);
  return platformAuthData.username;
}

//
// const PlatformSwitcher = InputComponent((p: TSwitchInputProps & {platform: TPlatform}) => {
//   const destination = p.platforms[platform];
//   const enabled = destination.enabled;
//   const isPrimary = view.isPrimaryPlatform(platform);
//   const platformService = getPlatformService(platform);
//   const platformName = platformService.displayName;
//   const username = UserService.state.auth?.platforms[platform]!.username;
//   const title = p.title ? $t(p.title, { platformName }) : platformName;
//   const canDisablePrimary = p.canDisablePrimary;
//
//   return (
//     <div
//       key={platform}
//       className={cx(styles.platformSwitcher, { [styles.platformDisabled]: !enabled })}
//     >
//       <div className={cx(styles.colInput)}>
//         {/*TODO:*/}
//         {/*{isPrimary && !canDisablePrimary ? (*/}
//         {/*  <span*/}
//         {/*    vTooltip={$t(*/}
//         {/*      'You cannot disable the platform you used to sign in to Streamlabs OBS. Please sign in with a different platform to disable streaming to this destination.',*/}
//         {/*    )}*/}
//         {/*  >*/}
//         {/*    <ToggleInput value={enabled} metadata={{ name: platform }} />*/}
//         {/*  </span>*/}
//         {/*) : (*/}
//         {/*  <ToggleInput value={enabled} metadata={{ name: platform }} />*/}
//         {/*)}*/}
//         <SwitchInput value={enabled} name={platform} />
//       </div>
//
//       {/* PLATFORM LOGO */}
//       <div className="logo margin-right--20">
//         <PlatformLogo platform={platform} className={styles[`platform-logo-${platform}`]} />
//       </div>
//
//       {/* PLATFORM TITLE AND ACCOUNT */}
//       <div className={styles.colAccount}>
//         <span className={styles.platformName}>{title}</span> <br />
//         {username} <br />
//       </div>
//     </div>
//   );
// }
