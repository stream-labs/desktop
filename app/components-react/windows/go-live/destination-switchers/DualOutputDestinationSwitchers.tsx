import React, { useRef, useCallback } from 'react';
import { getPlatformService, TPlatform } from 'services/platforms';
import cx from 'classnames';
import { $t } from 'services/i18n';
import styles from './DestinationSwitchers.m.less';
import { ICustomStreamDestination } from 'services/settings/streaming';
import { Services } from 'components-react/service-provider';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import DisplaySelector from 'components-react/shared/DisplaySelector';
import { useGoLiveSettings } from '../useGoLiveSettings';
import { alertAsync } from 'components-react/modals';
import DestinationSelector from '../destination-selector/DestinationSelector';
import { useDebounce } from 'components-react/hooks';
import { SwitchInput } from 'components-react/shared/inputs';

interface ISingleOutputDestinationSwitchers {
  isEnabled: (platform: TPlatform | number, isTikTokLinked: boolean) => boolean;
  toggleDest: (ind: number, enabled: boolean) => void;
}

export function DualOutputDestinationSwitchers(p: ISingleOutputDestinationSwitchers) {
  const {
    enabledPlatforms,
    linkedPlatforms,
    customDestinations,
    isRestreamEnabled,
    showSelector,
    switchPlatforms,
    switchCustomDestination,
    isPrimaryPlatform,
    isPlatformLinked,
    isPrime,
  } = useGoLiveSettings().extend(module => ({
    // non-ultra users can stream to a combined two platforms/destinations
    get showSelector() {
      const numCustomDestinations = module.state.customDestinations.filter(
        destination => destination.enabled,
      ).length;
      const numEnabledPlatforms = module.state.enabledPlatforms.length;

      return numCustomDestinations + numEnabledPlatforms < 2;
    },
  }));
  const enabledPlatformsRef = useRef(enabledPlatforms);
  enabledPlatformsRef.current = enabledPlatforms;
  const destinationSwitcherRef = useRef({ addClass: () => undefined });
  const promptConnectTikTok = !isPlatformLinked('tiktok');

  const platforms = isPrime ? linkedPlatforms : enabledPlatforms;
  const destinations = isPrime
    ? customDestinations
    : customDestinations.filter(destination => destination.enabled);
  const id = isPrime ? 'ultra-switchers' : 'non-ultra-switchers';

  const emitSwitch = useDebounce(500, () => {
    switchPlatforms(enabledPlatformsRef.current);
  });

  const togglePlatform = useCallback((platform: TPlatform, enabled: boolean) => {
    enabledPlatformsRef.current = enabledPlatformsRef.current.filter(
      (p: TPlatform) => p !== platform,
    );
    if (enabled) enabledPlatformsRef.current.push(platform);
    emitSwitch();
  }, []);

  return (
    <div id={id} className={styles.dualOutputSwitchers}>
      {platforms.map((platform: TPlatform, index: number) => (
        <DualOutputDestinationSwitcher
          key={platform}
          destination={platform}
          enabled={p.isEnabled(platform, promptConnectTikTok)}
          onChange={enabled => togglePlatform(platform, enabled)}
          isPrimary={isPrimaryPlatform(platform)}
          promptConnectTikTok={platform === 'tiktok' && promptConnectTikTok}
          canDisablePrimary={isRestreamEnabled}
          index={index}
        />
      ))}

      {destinations.map((destination, ind) => (
        <DualOutputDestinationSwitcher
          key={`dest-${ind}`}
          destination={destination}
          enabled={customDestinations[ind].enabled}
          onChange={enabled => p.toggleDest(ind, enabled)}
          index={ind}
        />
      ))}

      {!isPrime && showSelector && (
        <DestinationSelector
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
  const enable = !p.enabled ?? (p.promptConnectTikTok && p.promptConnectTikTok === true);
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
