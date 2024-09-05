import React, { useRef, MouseEvent, useCallback } from 'react';
import { getPlatformService, TPlatform } from 'services/platforms';
import cx from 'classnames';
import { $t } from 'services/i18n';
import styles from './DestinationSwitchers.m.less';
import { ICustomStreamDestination } from 'services/settings/streaming';
import { Services } from 'components-react/service-provider';
import { SwitchInput } from 'components-react/shared/inputs';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import DisplaySelector from 'components-react/shared/DisplaySelector';
import { useGoLiveSettings } from '../useGoLiveSettings';
import { alertAsync } from 'components-react/modals';
import { useDebounce } from 'components-react/hooks';

/**
 * Allows enabling/disabling platforms and custom destinations for the stream
 */
export function UltraDestinationSwitchers() {
  const {
    enabledPlatforms,
    linkedPlatforms,
    customDestinations,
    isPrimaryPlatform,
    isPlatformLinked,
    switchPlatforms,
    switchCustomDestination,
    isRestreamEnabled,
  } = useGoLiveSettings();
  const enabledPlatformsRef = useRef(enabledPlatforms);
  enabledPlatformsRef.current = enabledPlatforms;
  const promptConnectTikTok = !isPlatformLinked('tiktok');

  const emitSwitch = useDebounce(500, () => {
    switchPlatforms(enabledPlatformsRef.current);
  });

  const isEnabled = useCallback((target: TPlatform) => {
    if (target === 'tiktok' && promptConnectTikTok) {
      return false;
    }

    return enabledPlatformsRef.current.includes(target);
  }, []);

  const togglePlatform = useCallback((platform: TPlatform, enabled: boolean) => {
    enabledPlatformsRef.current = enabledPlatformsRef.current.filter(
      (p: TPlatform) => p !== platform,
    );
    if (enabled) enabledPlatformsRef.current.push(platform);
    emitSwitch();
  }, []);

  const toggleDestination = useCallback((index: number, enabled: boolean) => {
    // this timeout is to allow for the toggle animation
    setTimeout(() => switchCustomDestination(index, enabled), 500);
  }, []);

  return (
    <div id="ultra-switchers" className={styles.dualOutputSwitchers}>
      {linkedPlatforms.map((platform: TPlatform, index: number) => (
        <DestinationSwitcher
          key={platform}
          destination={platform}
          enabled={isEnabled(platform)}
          onChange={enabled => togglePlatform(platform, enabled)}
          isPrimary={isPrimaryPlatform(platform)}
          promptConnectTikTok={platform === 'tiktok' && promptConnectTikTok}
          canDisablePrimary={isRestreamEnabled}
          index={index}
        />
      ))}
      {customDestinations?.map((destination: ICustomStreamDestination, index: number) => (
        <DestinationSwitcher
          key={index}
          destination={destination}
          enabled={customDestinations[index].enabled}
          onChange={enabled => toggleDestination(index, enabled)}
          index={index}
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
  canDisablePrimary?: boolean;
  index: number;
}

/**
 * Render a single switcher card
 */
function DestinationSwitcher(p: IDestinationSwitcherProps) {
  const switchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const platform = typeof p.destination === 'string' ? (p.destination as TPlatform) : null;
  const enable = !p.enabled ?? (p.promptConnectTikTok && p.promptConnectTikTok === true);
  const { RestreamService, MagicLinkService } = Services;
  const canDisablePrimary = p.canDisablePrimary;

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

  function onClickHandler(ev: MouseEvent) {
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

  const { title, description, Switch, Logo } = (() => {
    if (platform) {
      const { UserService } = Services;
      // define slots for a platform switcher
      const service = getPlatformService(platform);
      const platformAuthData = UserService.state.auth?.platforms[platform];
      const username = platformAuthData?.username ?? '';

      return {
        title: service.displayName,
        description: username,
        Logo: () => (
          <PlatformLogo
            platform={platform}
            className={cx(styles.logo, styles[`platform-logo-${platform}`])}
            size={36}
            // fontIcon={platform}
          />
        ),
        Switch: () => (
          <SwitchInput
            inputRef={switchInputRef}
            value={p.enabled}
            name={platform}
            disabled={
              canDisablePrimary
                ? false
                : p?.isPrimary || (p.promptConnectTikTok && platform === 'tiktok')
            }
            uncontrolled
            nolabel
            className={styles.dualOutputPlatformSwitch}
            checkedChildren={<i className="icon-check-mark" />}
          />
        ),
      };
    } else {
      // define slots for a custom destination switcher
      const destination = p.destination as ICustomStreamDestination;
      return {
        title: destination.name,
        description: destination.url,
        Logo: () => (
          <i className={cx('fa fa-globe', styles.logo, styles[`platform-logo-${platform}`])} />
        ),
        Switch: () => (
          <SwitchInput
            inputRef={switchInputRef}
            value={destination?.enabled}
            name={`destination_${destination?.name}`}
            uncontrolled
            nolabel
            className={styles.platformSwitch}
            checkedChildren={<i className="icon-check-mark" />}
          />
        ),
      };
    }
  })();

  return (
    <div
      ref={containerRef}
      data-test="ultra-switcher"
      className={cx(styles.dualOutputPlatformSwitcher, { [styles.platformDisabled]: !p.enabled })}
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
            if (p.promptConnectTikTok) {
              showTikTokConnectModal();
              e.stopPropagation();
              return;
            } else {
              onClickHandler(e);
            }
          }}
        >
          <Switch />
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
