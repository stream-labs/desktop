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
import { alertAsync } from '../../modals';
import DisplaySelector from 'components-react/shared/DisplaySelector';
import DualOutputPlatformSelector from './dual-output/DualOutputPlatformSelector';

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
    isDualOutputMode,
  } = useGoLiveSettings();
  // use these references to apply debounce
  // for error handling and switch animation
  const enabledPlatformsRef = useRef(enabledPlatforms);
  enabledPlatformsRef.current = enabledPlatforms;
  const enabledDestRef = useRef(enabledDestinations);
  enabledDestRef.current = enabledDestinations;
  const destinationSwitcherRef = useRef({ addClass: () => undefined });

  const shouldDisableCustomDestinationSwitchers = () => {
    // Multistream users can always add destinations
    if (isRestreamEnabled) {
      return false;
    }

    // Otherwise, only a single platform and no custom destinations
    return enabledPlatforms.length > 0;
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
    enabledPlatformsRef.current = enabledPlatformsRef.current.filter(p => p !== platform);

    if (enabled) {
      enabledPlatformsRef.current.push(platform);
    }

    // Do not allow disabling the last platform
    if (!enabledPlatformsRef.current.length) {
      enabledPlatformsRef.current.push(platform);
    }

    emitSwitch();
  }

  // TODO: find a cleaner way to do this
  const isPrimary = (platform: TPlatform) =>
    isPrimaryPlatform(platform) || linkedPlatforms.length === 1;

  return (
    <div className={cx(styles.switchWrapper, styles.columnPadding)}>
      {linkedPlatforms.map((platform, ind) => (
        <DestinationSwitcher
          key={platform}
          destination={platform}
          enabled={isEnabled(platform)}
          onChange={enabled => togglePlatform(platform, enabled)}
          isPrimary={isPrimary(platform)}
          isDualOutputMode={isDualOutputMode}
          index={ind}
        />
      ))}

      {customDestinations?.map((dest, ind) => (
        <DestinationSwitcher
          key={ind}
          destination={dest}
          enabled={customDestinations[ind].enabled && !disableCustomDestinationSwitchers}
          onChange={enabled => switchCustomDestination(ind, enabled)}
          disabled={disableCustomDestinationSwitchers}
          isDualOutputMode={isDualOutputMode}
          index={ind}
        />
      ))}
      {p.showSelector && (
        <DualOutputPlatformSelector
          togglePlatform={platform => {
            togglePlatform(platform, true);
            destinationSwitcherRef.current.addClass();
          }}
          showSwitcher={destinationSwitcherRef.current.addClass}
          switchDestination={index => {
            switchCustomDestination(index, true);
            destinationSwitcherRef.current.addClass();
          }}
        />
      )}
    </div>
  );
}

interface IDestinationSwitcherProps {
  destination: TPlatform | ICustomStreamDestination;
  enabled: boolean;
  onChange: (enabled: boolean) => unknown;
  isPrimary?: boolean;
  disabled?: boolean;
  index: number;
  isDualOutputMode: boolean;
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
  const { RestreamService, StreamingService, MagicLinkService } = Services;

  function dualOutputClickHandler(ev: MouseEvent) {
    // TODO: do we need this check if we're on an Ultra DestinationSwitcher
    if (p.isPrimary && StreamingService.views.isMultiplatformMode !== true) {
      alertAsync(
        $t(
          'You cannot disable the platform you used to sign in to Streamlabs Desktop. Please sign in with a different platform to disable streaming to this destination.',
        ),
      );
      return;
    }

    if (RestreamService.views.canEnableRestream) {
      p.onChange(!p.enabled);
      // always proxy the click to the SwitchInput
      // so it can play a transition animation
      switchInputRef.current?.click();
      // switch the container class without re-rendering to not stop the animation
      if (!p.enabled) {
        containerRef.current?.classList.remove(styles.platformDisabled);
      } else {
        containerRef.current?.classList.add(styles.platformDisabled);
      }
    } else {
      MagicLinkService.actions.linkToPrime('slobs-multistream');
    }
  }

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

  function addClass() {
    containerRef.current?.classList.remove(styles.platformDisabled);
  }

  function removeClass() {
    p.onChange(false);
    containerRef.current?.classList.add(styles.platformDisabled);
  }

  const { title, description, Controller, Logo } = (() => {
    const { UserService } = Services;
    const showCloseIcon = p.isDualOutputMode && !UserService.views.isPrime;

    if (platform) {
      // define slots for a platform switcher
      const service = getPlatformService(platform);
      const platformAuthData = UserService.state.auth?.platforms[platform];
      const username = platformAuthData?.username ?? '';

      return {
        title: $t('Stream to %{platformName}', { platformName: service.displayName }),
        description: username,
        Logo: () => (
          <PlatformLogo
            platform={platform}
            className={cx(
              styles[`platform-logo-${platform}`],
              p.isDualOutputMode ? styles.dualOutputLogo : styles.singleOutputLogo,
            )}
          />
        ),
        Controller: () =>
          showCloseIcon ? (
            <CloseIcon removeClass={removeClass} isPrimary={p?.isPrimary} />
          ) : (
            <SwitchInput
              inputRef={switchInputRef}
              value={p.enabled}
              name={platform}
              disabled={p.disabled}
              uncontrolled
              nolabel
              className={p.isDualOutputMode && styles.dualOutputPlatformSwitch}
              checkedChildren={p.isDualOutputMode && <i className="icon-check-mark" />}
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
        Controller: () =>
          showCloseIcon ? (
            <CloseIcon removeClass={removeClass} isPrimary={p?.isPrimary} />
          ) : (
            <SwitchInput
              inputRef={switchInputRef}
              value={p.enabled}
              name={`destination_${destination.name}`}
              disabled={p.disabled}
              uncontrolled
              nolabel
              className={p.isDualOutputMode && styles.dualOutputPlatformSwitch}
              checkedChildren={p.isDualOutputMode && <i className="icon-check-mark" />}
            />
          ),
      };
    }
  })();

  if (p.isDualOutputMode) {
    return (
      <div
        ref={containerRef}
        data-test={platform ? `${platform}-dual-output` : 'destination-dual-output'}
        className={cx(styles.dualOutputPlatformSwitcher, {
          [styles.platformDisabled]: !p.enabled,
        })}
      >
        <div className={styles.dualOutputPlatformInfo}>
          {/* LOGO */}
          <Logo />
          {/* INFO */}
          <div className={styles.dualOutputColAccount}>
            <div className={styles.dualOutputPlatformName}>{title}</div>
            <div className={styles.dualOutputPlatformUsername}>{description}</div>
          </div>
          {/* SWITCH */}
          <div className={cx(styles.dualOutputColInput)} onClick={dualOutputClickHandler}>
            <Controller />
          </div>
        </div>

        <DisplaySelector
          title={title}
          className={styles.dualOutputDisplaySelector}
          platform={platform}
          label={$t('Output')}
          index={p.index}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cx(styles.platformSwitcher, {
        [styles.platformDisabled]: !p.enabled,
      })}
      onClick={onClickHandler}
    >
      <div className={cx(styles.colInput)}>
        <Controller />
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

interface IDestinationSwitcherProps {
  destination: TPlatform | ICustomStreamDestination;
  enabled: boolean;
  onChange: (enabled: boolean) => unknown;
  isPrimary?: boolean;
  promptConnectTikTok?: boolean;
  index: number;
  canDisablePrimary?: boolean;
}

/**
 * Render a single switcher card
 */

// disable `func-call-spacing` and `no-spaced-func` rules
// to pass back reference to addClass function
// eslint-disable-next-line
const DualOutputDestinationSwitcher = React.forwardRef<
  // eslint-disable-next-line
  { addClass: () => void },
  IDestinationSwitcherProps
>((p, ref) => {
  React.useImperativeHandle(ref, () => {
    return {
      addClass() {
        addClass();
      },
    };
  });
  const switchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { RestreamService, MagicLinkService, UserService } = Services;

  const platform = typeof p.destination === 'string' ? (p.destination as TPlatform) : null;
  const enable = !p.enabled;
  const canDisable = p.canDisablePrimary;
  const isPrime = Services.UserService.views.isPrime;

  function addClass() {
    containerRef.current?.classList.remove(styles.platformDisabled);
  }

  function removeClass() {
    if (canDisable) {
      alertAsync(
        $t(
          'You cannot disable the platform you used to sign in to Streamlabs Desktop. Please sign in with a different platform to disable streaming to this destination.',
        ),
      );
      return;
    }

    p.onChange(false);
    containerRef.current?.classList.add(styles.platformDisabled);
  }

  function showTikTokConnectModal() {
    alertAsync({
      type: 'confirm',
      title: $t('Connect TikTok Account'),
      closable: true,
      content: (
        <span>
          {$t(
            'Connect your TikTok account to stream to TikTok and one additional platform for free.',
          )}
        </span>
      ),
      okText: $t('Connect'),
      onOk: () => {
        Services.NavigationService.actions.navigate('PlatformMerge', { platform: 'tiktok' });
        Services.WindowsService.actions.closeChildWindow();
      },
    });
  }

  function onClickHandler() {
    // TODO: do we need this check if we're on an Ultra DestinationSwitcher
    if (p.isPrimary && p.canDisablePrimary !== true) {
      alertAsync(
        $t(
          'You cannot disable the platform you used to sign in to Streamlabs Desktop. Please sign in with a different platform to disable streaming to this destination.',
        ),
      );
      return;
    }

    if (RestreamService.views.canEnableRestream && !p.promptConnectTikTok) {
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
    } else {
      MagicLinkService.actions.linkToPrime('slobs-multistream');
    }
  }

  const { title, description, Controller, Logo } = (() => {
    if (platform) {
      const { UserService } = Services;
      // define slots for a platform switcher
      const service = getPlatformService(platform);
      const platformAuthData = UserService.state.auth?.platforms[platform] ?? {
        username: '',
      };
      const username = platformAuthData?.username ?? '';

      return {
        title: service.displayName,
        description: username,
        Logo: () => (
          <PlatformLogo
            platform={platform}
            className={cx(styles.logo, styles[`platform-logo-${platform}`])}
            size={36}
          />
        ),
        Controller: () =>
          isPrime ? (
            <Switch
              inputRef={switchInputRef}
              value={p.enabled}
              name={platform}
              disabled={
                p.canDisablePrimary
                  ? false
                  : p?.isPrimary || (p.promptConnectTikTok && platform === 'tiktok')
              }
            />
          ) : (
            <CloseIcon removeClass={removeClass} isPrimary={p?.isPrimary} />
          ),
      };
    } else {
      // define slots for a custom destination switcher
      const destination = p.destination as ICustomStreamDestination;
      return {
        title: destination.name,
        description: destination.url,
        Logo: () => <i className={cx(styles.destinationLogo, 'fa fa-globe')} />,
        Controller: () =>
          isPrime ? (
            <Switch
              inputRef={switchInputRef}
              value={destination?.enabled}
              name={`destination_${destination?.name}`}
            />
          ) : (
            <CloseIcon removeClass={removeClass} isPrimary={p?.isPrimary} />
          ),
      };
    }
  })();

  return (
    <div
      ref={containerRef}
      data-test={platform ? `${platform}-dual-output` : 'destination-dual-output'}
      className={cx(styles.dualOutputPlatformSwitcher, {
        [styles.platformDisabled]: !p.enabled || p.promptConnectTikTok,
      })}
      onClick={() => {
        if (p.promptConnectTikTok) {
          showTikTokConnectModal();
        }
      }}
    >
      <div className={styles.dualOutputPlatformInfo}>
        {/* LOGO */}
        <Logo />
        {/* INFO */}
        <div className={styles.colAccount}>
          <span className={styles.platformName}>{title}</span>
          <span className={styles.platformUsername}>{description}</span>
        </div>
        {/* SWITCH */}
        <div
          className={cx(styles.colInput)}
          onClick={e => {
            if (!UserService.views.isPrime) return;

            if (p.promptConnectTikTok) {
              showTikTokConnectModal();
              e.stopPropagation();
              return;
            } else {
              onClickHandler();
            }
          }}
        >
          <Controller />
        </div>
      </div>

      <DisplaySelector
        title={title}
        className={styles.dualOutputDisplaySelector}
        platform={platform}
        label={$t('Output')}
        index={p.index}
      />
    </div>
  );
});

function CloseIcon(p: { removeClass: () => void; isPrimary?: boolean }) {
  return p?.isPrimary ? (
    <></>
  ) : (
    <i
      className={cx('icon-close', styles.close)}
      onClick={e => {
        e.stopPropagation();
        p.removeClass();
      }}
    />
  );
}

function Switch(p: { inputRef: any; name: string; value: boolean; disabled?: boolean }) {
  return (
    <SwitchInput
      inputRef={p.inputRef}
      value={p.value}
      name={p.name}
      uncontrolled
      nolabel
      className={styles.dualOutputPlatformSwitch}
      checkedChildren={<i className="icon-check-mark" />}
      disabled={p.disabled}
    />
  );
}
