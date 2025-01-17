import React, { useRef, MouseEvent } from 'react';
import { getPlatformService, TPlatform } from '../../../services/platforms';
import cx from 'classnames';
import { $t } from '../../../services/i18n';
import styles from './DestinationSwitchers.m.less';
import { ICustomStreamDestination } from '../../../services/settings/streaming';
import { Services } from '../../service-provider';
import { SwitchInput } from '../../shared/inputs';
import PlatformLogo from '../../shared/PlatformLogo';
import { useDebounce } from '../../hooks';
import { useGoLiveSettings } from './useGoLiveSettings';

/**
 * Allows enabling/disabling platforms and custom destinations for the stream
 */
export function DestinationSwitchers(p: { showSelector?: boolean }) {
  const {
    linkedPlatforms,
    enabledPlatforms,
    customDestinations,
    enabledDestinations,
    switchPlatforms,
    switchCustomDestination,
    isPrimaryPlatform,
    isRestreamEnabled,
  } = useGoLiveSettings();
  // use these references to apply debounce
  // for error handling and switch animation
  const enabledPlatformsRef = useRef(enabledPlatforms);
  const platforms = Services.TikTokService.shouldHideTikTok
    ? enabledPlatforms.filter(platform => platform !== 'tiktok')
    : enabledPlatforms;
  enabledPlatformsRef.current = platforms;

  const enabledDestRef = useRef(enabledDestinations);
  enabledDestRef.current = enabledDestinations;

  const shouldDisableCustomDestinationSwitchers = () => {
    // Multistream users can always add destinations
    if (isRestreamEnabled) {
      return false;
    }

    // Otherwise, only a single platform and no custom destinations
    return platforms.length > 0;
  };

  const disableCustomDestinationSwitchers = shouldDisableCustomDestinationSwitchers();

  const emitSwitch = useDebounce(500, (ind?: number, enabled?: boolean) => {
    if (ind !== undefined && enabled !== undefined) {
      switchCustomDestination(ind, enabled);
    } else {
      switchPlatforms(enabledPlatformsRef.current);
    }
  });

  function isEnabled(target: TPlatform | number) {
    if (typeof target === 'number') {
      return enabledDestRef.current.includes(target);
    } else {
      return enabledPlatformsRef.current.includes(target);
    }
  }

  function togglePlatform(platform: TPlatform, enabled: boolean) {
    if (!isRestreamEnabled) {
      /*
       * Clearing this list ensures that when a new platform is selected, instead of enabling 2 platforms
       * we switch to 1 enabled platforms that was just toggled.
       */
      enabledPlatformsRef.current = [];
    } else {
      enabledPlatformsRef.current = enabledPlatformsRef.current.filter(p => p !== platform);
    }

    if (enabled) {
      enabledPlatformsRef.current.push(platform);
    }

    // Do not allow disabling the last platform
    if (!enabledPlatformsRef.current.length) {
      enabledPlatformsRef.current.push(platform);
    }

    emitSwitch();
  }

  return (
    <div className={cx(styles.switchWrapper, styles.columnPadding)}>
      {linkedPlatforms
        .filter(p => p !== 'tiktok')
        .map(platform => (
          <DestinationSwitcher
            key={platform}
            destination={platform}
            enabled={isEnabled(platform)}
            onChange={enabled => togglePlatform(platform, enabled)}
            isPrimary={isPrimaryPlatform(platform)}
          />
        ))}

      {customDestinations?.map((dest, ind) => (
        <DestinationSwitcher
          key={ind}
          destination={dest}
          enabled={customDestinations[ind].enabled && !disableCustomDestinationSwitchers}
          onChange={enabled => switchCustomDestination(ind, enabled)}
          disabled={disableCustomDestinationSwitchers}
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
  disabled?: boolean;
}

/**
 * Render a single switcher
 */
// disable `func-call-spacing` and `no-spaced-func` rules
// to pass back reference to addClass function
// eslint-disable-next-line
const DestinationSwitcher = React.forwardRef<{}, IDestinationSwitcherProps>((p, ref) => {
  const switchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const platform = typeof p.destination === 'string' ? (p.destination as TPlatform) : null;

  function onClickHandler(ev: MouseEvent) {
    // If we're disabling the switch we shouldn't be emitting anything past below
    if (p.disabled) {
      return;
    }

    const enable = !p.enabled;
    p.onChange(enable);
    // always proxy the click to the SwitchInput
    // so it can play a transition animation
    switchInputRef.current?.click();
  }

  const { title, description, Switch, Logo } = (() => {
    if (platform) {
      // define slots for a platform switcher
      const { UserService } = Services;
      const service = getPlatformService(platform);
      const platformAuthData = UserService.state.auth?.platforms[platform];
      const username = platformAuthData?.username ?? '';

      return {
        title: $t('Stream to %{platformName}', { platformName: service.displayName }),
        description: username,
        Logo: () => (
          <PlatformLogo platform={platform} className={styles[`platform-logo-${platform}`]} />
        ),
        Switch: () => (
          <SwitchInput inputRef={switchInputRef} value={p.enabled} name={platform} uncontrolled />
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
            value={p.enabled}
            name={`destination_${destination.name}`}
            disabled={p.disabled}
            uncontrolled
          />
        ),
      };
    }
  })();

  return (
    <div
      ref={containerRef}
      className={cx(styles.platformSwitcher, {
        [styles.platformDisabled]: !p.enabled,
      })}
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
});
