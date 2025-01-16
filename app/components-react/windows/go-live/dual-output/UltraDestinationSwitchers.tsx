import React, { useRef, MouseEvent, useCallback, useMemo } from 'react';
import { getPlatformService, TPlatform } from 'services/platforms';
import cx from 'classnames';
import { $t } from 'services/i18n';
import styles from '../GoLive.m.less';
import { ICustomStreamDestination } from 'services/settings/streaming';
import { Services } from 'components-react/service-provider';
import { SwitchInput } from 'components-react/shared/inputs';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import InfoBadge from 'components-react/shared/InfoBadge';
import DisplaySelector from 'components-react/shared/DisplaySelector';
import { useGoLiveSettings } from '../useGoLiveSettings';
import { alertAsync } from 'components-react/modals';
import Translate from 'components-react/shared/Translate';
import { useDebounce } from 'components-react/hooks';
import DualOutputToggle from '../../../shared/DualOutputToggle';
import { renderTikTokModal } from '../DestinationSwitchers';

interface IUltraDestinationSwitchers {
  type?: 'default' | 'ultra';
}

/**
 * Allows enabling/disabling platforms and custom destinations for the stream
 */
export function UltraDestinationSwitchers(p: IUltraDestinationSwitchers) {
  const {
    enabledPlatforms,
    linkedPlatforms,
    customDestinations,
    isDualOutputMode,
    isPrimaryPlatform,
    isPlatformLinked,
    switchPlatforms,
    switchCustomDestination,
    isRestreamEnabled,
  } = useGoLiveSettings();
  const enabledPlatformsRef = useRef(enabledPlatforms);
  enabledPlatformsRef.current = enabledPlatforms;

  const platforms = linkedPlatforms.filter((platform: TPlatform) => platform !== 'tiktok');

  const emitSwitch = useDebounce(500, () => {
    switchPlatforms(enabledPlatformsRef.current);
  });
  const isEnabled = useCallback((target: TPlatform) => {
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
    <div className={cx(styles.switchWrapper, styles.columnPadding)}>
      {isDualOutputMode && (
        <InfoBadge
          content={
            <>
              <DualOutputToggle type="dual" lightShadow />
              <Translate message="<dualoutput>Dual Output</dualoutput> is enabled - you must stream to one horizontal and one vertical platform.">
                <u slot="dualoutput" />
              </Translate>
            </>
          }
          style={{ marginBottom: '15px' }}
        />
      )}

      {platforms.map((platform: TPlatform, index: number) => (
        <DestinationSwitcher
          key={platform}
          destination={platform}
          enabled={isEnabled(platform)}
          onChange={enabled => togglePlatform(platform, enabled)}
          isPrimary={isPrimaryPlatform(platform)}
          promptConnectTikTok={false}
          canDisablePrimary={isRestreamEnabled}
          index={index}
        />
      ))}

      {isPlatformLinked('tiktok') && (
        <DestinationSwitcher
          key={'tiktok'}
          destination={'tiktok'}
          enabled={false}
          onChange={() => {}}
          isPrimary={isPrimaryPlatform('tiktok')}
          promptConnectTikTok={true}
          canDisablePrimary={isRestreamEnabled}
          index={platforms.length}
        />
      )}

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
  const enable = !p.enabled;
  const { RestreamService, MagicLinkService, TikTokService } = Services;
  const canDisablePrimary = p.canDisablePrimary;

  function onClickHandler(ev: MouseEvent) {
    if (p.promptConnectTikTok) {
      renderTikTokModal(p.isPrimary);
      return;
    }

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
            className={cx(styles.platformLogo, styles[`platform-logo-${platform}`])}
            size={36}
          />
        ),
        Switch: () => (
          <SwitchInput
            inputRef={switchInputRef}
            value={p.enabled}
            name={platform}
            disabled={p.promptConnectTikTok ?? (canDisablePrimary ? false : p?.isPrimary)}
            uncontrolled
            className={styles.platformSwitch}
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
        Logo: () => <i className={cx(styles.destinationLogo, 'fa fa-globe')} />,
        Switch: () => (
          <SwitchInput
            inputRef={switchInputRef}
            value={destination?.enabled}
            name={`destination_${destination?.name}`}
            uncontrolled
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
      className={cx(styles.platformSwitcher, {
        [styles.platformDisabled]: !p.enabled || p.promptConnectTikTok,
      })}
      onClick={e => {
        if (p.promptConnectTikTok) {
          renderTikTokModal(p.isPrimary);
          e.stopPropagation();
        }
      }}
    >
      <div className={styles.switcherHeader}>
        <div className={styles.platformInfoWrapper}>
          {/* LOGO */}
          <Logo />
          {/* INFO */}
          <div className={styles.platformInfo}>
            <span className={styles.platformName}>{title}</span>
            <span className={styles.platformUsername}>{description}</span>
          </div>
        </div>
        {/* SWITCH */}
        <div
          onClick={e => {
            if (p.promptConnectTikTok) {
              renderTikTokModal(p.isPrimary);
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
      <div className={styles.platformDisplay}>
        <span className={styles.label}>{`${$t('Output')}:`}</span>
        <DisplaySelector title={title} platform={platform} index={p.index} nolabel nomargin />
      </div>
    </div>
  );
}
