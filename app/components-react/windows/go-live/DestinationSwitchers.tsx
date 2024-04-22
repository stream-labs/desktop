import React, { useRef, MouseEvent } from 'react';
import { getPlatformService, TPlatform } from '../../../services/platforms';
import cx from 'classnames';
import { $t } from '../../../services/i18n';
import styles from './DestinationSwitchers.m.less';
import { ICustomStreamDestination } from '../../../services/settings/streaming';
import { Services } from '../../service-provider';
import { SwitchInput } from '../../shared/inputs';
import PlatformLogo from '../../shared/PlatformLogo';
import { assertIsDefined } from '../../../util/properties-type-guards';
import { useDebounce } from '../../hooks';
import { useGoLiveSettings } from './useGoLiveSettings';
import { alertAsync } from '../../modals';

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
    isPlatformLinked,
  } = useGoLiveSettings();
  // use these references to apply debounce
  // for error handling and switch animation
  const enabledPlatformsRef = useRef(enabledPlatforms);
  enabledPlatformsRef.current = enabledPlatforms;
  const enabledDestRef = useRef(enabledDestinations);
  enabledDestRef.current = enabledDestinations;

  // special handling for TikTok for non-ultra users
  // to disable/enable platforms and open ultra link
  const promptConnectTikTok = !isPlatformLinked('tiktok');
  const disableSwitchers =
    promptConnectTikTok && (enabledPlatforms.length > 1 || enabledDestinations.length > 0);

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
      if (target === 'tiktok' && promptConnectTikTok) {
        return false;
      }

      return enabledPlatformsRef.current.includes(target);
    }
  }

  function togglePlatform(platform: TPlatform, enabled: boolean) {
    enabledPlatformsRef.current = enabledPlatformsRef.current.filter(p => p !== platform);
    if (enabled) enabledPlatformsRef.current.push(platform);
    emitSwitch();
  }

  function toggleDest(ind: number, enabled: boolean) {
    enabledDestRef.current = enabledDestRef.current.filter(index => index !== ind);
    if (enabled) {
      enabledDestRef.current.push(ind);
    }
    emitSwitch(ind, enabled);
  }

  // TODO: find a cleaner way to do this
  const isPrimary = (platform: TPlatform) =>
    isPrimaryPlatform(platform) || linkedPlatforms.length === 1;

  return (
    <div>
      {linkedPlatforms.map(platform => (
        <DestinationSwitcher
          key={platform}
          destination={platform}
          enabled={isEnabled(platform)}
          onChange={enabled => togglePlatform(platform, enabled)}
          promptConnectTikTok={platform === 'tiktok' && promptConnectTikTok}
          isPrimary={isPrimaryPlatform(platform)}
          disabled={disableSwitchers && !isEnabled(platform)}
        />
      ))}

      {!linkedPlatforms.includes('tiktok') && (
        <DestinationSwitcher
          destination={'tiktok'}
          enabled={isEnabled('tiktok')}
          onChange={enabled => togglePlatform('tiktok', enabled)}
          isPrimary={isPrimaryPlatform('tiktok')}
          promptConnectTikTok={promptConnectTikTok}
          disabled={disableSwitchers && !isEnabled('tiktok')}
        />
      )}

      {customDestinations?.map((dest, ind) => (
        <DestinationSwitcher
          key={ind}
          destination={dest}
          enabled={customDestinations[ind].enabled}
          onChange={enabled => switchCustomDestination(ind, enabled)}
          disabled={disableSwitchers && !isEnabled(ind)}
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
  promptConnectTikTok?: boolean;
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
  const { RestreamService, MagicLinkService, StreamingService } = Services;
  const canEnableRestream = RestreamService.views.canEnableRestream;
  const cannotDisableDestination = p.isPrimary && !canEnableRestream;

  // Preserving old TikTok functionality, so they can't enable the toggle if TikTok is not
  // connected.
  // TODO: this kind of logic should belong on caller, but ideally we would refactor all this
  const tiktokDisabled =
    platform === 'tiktok' && !StreamingService.views.isPlatformLinked('tiktok');

  function onClickHandler(ev: MouseEvent) {
    // If re-stream isn't enabled, don't allow disabling the primary platform
    if (cannotDisableDestination) {
      alertAsync(
        $t(
          'You cannot disable the platform you used to sign in to Streamlabs Desktop. Please sign in with a different platform to disable streaming to this destination.',
        ),
      );
      return;
    }

    if (p.promptConnectTikTok) {
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
      return;
    }

    if (canEnableRestream || !p.promptConnectTikTok) {
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
    } else {
      MagicLinkService.actions.linkToPrime('slobs-multistream');
    }
  }

  function addClass() {
    containerRef.current?.classList.remove(styles.platformDisabled);
  }

  function removeClass() {
    if (p.isPrimary) {
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

  const { title, description, Switch, Logo } = (() => {
    if (platform) {
      // define slots for a platform switcher
      const { UserService, StreamingService } = Services;
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
          <SwitchInput
            inputRef={switchInputRef}
            value={p.enabled}
            name={platform}
            disabled={cannotDisableDestination || tiktokDisabled}
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
        [styles.platformDisabled]: !p.enabled || p.promptConnectTikTok,
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
