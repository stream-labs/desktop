import React, { useRef, useCallback, useMemo } from 'react';
import { getPlatformService, TPlatform } from 'services/platforms';
import cx from 'classnames';
import { $t } from 'services/i18n';
import styles from '../GoLive.m.less';
import { ICustomStreamDestination } from 'services/settings/streaming';
import { Services } from 'components-react/service-provider';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import InfoBadge from 'components-react/shared/InfoBadge';
import DisplaySelector from 'components-react/shared/DisplaySelector';
import { useGoLiveSettings } from '../useGoLiveSettings';
import { alertAsync } from 'components-react/modals';
import Translate from 'components-react/shared/Translate';
import DualOutputPlatformSelector from './DualOutputPlatformSelector';
import { useDebounce } from 'components-react/hooks';
import DualOutputToggle from '../../../shared/DualOutputToggle';
import { renderTikTokModal } from '../DestinationSwitchers';

interface INonUltraDestinationSwitchers {
  showSelector?: boolean;
}

export function NonUltraDestinationSwitchers(p: INonUltraDestinationSwitchers) {
  const {
    enabledPlatforms,
    customDestinations,
    isDualOutputMode,
    switchPlatforms,
    switchCustomDestination,
    isPrimaryPlatform,
    isPlatformLinked,
    isRestreamEnabled,
  } = useGoLiveSettings();
  const enabledPlatformsRef = useRef(enabledPlatforms);
  enabledPlatformsRef.current = enabledPlatforms;
  const destinationSwitcherRef = useRef({ addClass: () => undefined });
  const promptConnectTikTok = !isPlatformLinked('tiktok');

  const platforms = useMemo(
    () => (promptConnectTikTok ? enabledPlatforms.concat('tiktok') : enabledPlatforms),
    [enabledPlatforms, promptConnectTikTok],
  );

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

  function isEnabled(target: TPlatform) {
    if (target === 'tiktok' && promptConnectTikTok) {
      return false;
    }

    return enabledPlatforms.includes(target);
  }

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
          promptConnectTikTok={platform === 'tiktok' && promptConnectTikTok}
          canDisablePrimary={isRestreamEnabled}
          index={index}
        />
      ))}
      {customDestinations
        .map((destination: ICustomStreamDestination, index: number) => ({ ...destination, index }))
        .filter(destination => destination.enabled)
        .map(destination => (
          <DestinationSwitcher
            key={destination.index}
            destination={destination}
            enabled={customDestinations[destination.index].enabled}
            onChange={() => switchCustomDestination(destination.index, false)}
            index={destination.index}
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
const DestinationSwitcher = React.forwardRef<{ addClass: () => void }, IDestinationSwitcherProps>(
  (p, ref) => {
    React.useImperativeHandle(ref, () => {
      return {
        addClass() {
          addClass();
        },
      };
    });
    const containerRef = useRef<HTMLDivElement>(null);
    const { TikTokService } = Services;
    const platform = typeof p.destination === 'string' ? (p.destination as TPlatform) : null;
    const showTikTokModal =
      p.promptConnectTikTok || (platform === 'tiktok' && TikTokService.missingLiveAccess);

    function addClass() {
      containerRef.current?.classList.remove(styles.platformDisabled);
    }

    function removeClass() {
      if (p.isPrimary && p.canDisablePrimary !== true) {
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

    const { title, description, CloseIcon, Logo } = (() => {
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
              className={cx(styles.platformLogo, styles[`platform-logo-${platform}`])}
              size={36}
            />
          ),
          CloseIcon: () => (
            <i
              className={cx('icon-close', styles.close)}
              onClick={e => {
                e.stopPropagation();
                removeClass();
              }}
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
          CloseIcon: () => <i className={cx('icon-close', styles.close)} onClick={removeClass} />,
        };
      }
    })();
    return (
      <div
        data-test="non-ultra-switcher"
        className={cx(styles.platformSwitcher, {
          [styles.platformDisabled]: !p.enabled || p.promptConnectTikTok,
        })}
      >
        <div
          ref={containerRef}
          className={styles.switcherHeader}
          onClick={() => {
            if (showTikTokModal) {
              renderTikTokModal(p.promptConnectTikTok);
            }
          }}
        >
          <div className={styles.platformInfoWrapper}>
            {/* LOGO */}
            <Logo />
            {/* INFO */}
            <div className={styles.platformInfo}>
              <span className={styles.platformName}>{title}</span>
              <span className={styles.platformUsername}>{description}</span>
            </div>
            {/* CLOSE */}
            {(!p.isPrimary || !p.promptConnectTikTok) && <CloseIcon />}
          </div>
        </div>
        <div className={styles.platformDisplay}>
          <DisplaySelector
            title={title}
            platform={platform}
            index={p.index}
            label={`${$t('Output')}:`}
          />
        </div>
      </div>
    );
  },
);
