import React, { useRef, MouseEvent } from 'react';
import { getPlatformService, TPlatform } from 'services/platforms';
import cx from 'classnames';
import { $t } from 'services/i18n/i18n';
import styles from './DestinationSwitchers.m.less';
import { ICustomStreamDestination } from 'services/settings/streaming';
import { Services } from '../../../service-provider';
import { SwitchInput } from 'components-react/shared/inputs';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import { useGoLiveSettings } from '../useGoLiveSettings';
import { alertAsync } from 'components-react/modals';

interface ISingleOutputSwitcherProps {
  destination: TPlatform | ICustomStreamDestination;
  enabled: boolean;
  onChange: (enabled: boolean) => unknown;
  isPrimary?: boolean;
  promptConnectTikTok?: boolean;
  disabled?: boolean;
}

interface ISingleOutputDestinationSwitchers {
  isEnabled: (platform: TPlatform | number) => boolean;
  togglePlatform: (target: TPlatform, enabled: boolean) => void;
  toggleDest: (ind: number, enabled: boolean) => void;
}

/**
 * Render all single output switchers
 * @remark There is special handling for TikTok for:
 * - Non-ultra users are always able to stream to TikTok
 * - Any user that does not have TikTok linked will always see the TikTok card
 *   and will be prompted to log in on click
 */
export function SingleOutputDestinationSwitchers(p: ISingleOutputDestinationSwitchers) {
  const {
    linkedPlatforms,
    customDestinations,
    disableCustomDestinationSwitchers,
    isPrimaryPlatform,
  } = useGoLiveSettings().extend(module => {
    return {
      get disableCustomDestinationSwitchers() {
        // Multistream users can always add destinations
        if (module.isRestreamEnabled) {
          return false;
        }

        const maxAddlPlatforms = module.isPrimaryPlatform('tiktok') ? 1 : 0;

        // Otherwise, only a single platform and no custom destinations,
        // TikTok should be handled by platform switching
        return module.enabledPlatforms.length > maxAddlPlatforms;
      },

      isPrimaryPlatform(platform: TPlatform) {
        return module.isPrimaryPlatform(platform) || linkedPlatforms.length === 1;
      },
    };
  });

  return (
    <div id="single-output-switchers">
      {linkedPlatforms.map(platform => (
        <SingleOutputDestinationSwitcher
          key={platform}
          destination={platform}
          enabled={p.isEnabled(platform)}
          onChange={enabled => p.togglePlatform(platform, enabled)}
          promptConnectTikTok={false}
          isPrimary={isPrimaryPlatform(platform)}
        />
      ))}

      {!linkedPlatforms.includes('tiktok') && (
        <SingleOutputDestinationSwitcher
          destination={'tiktok'}
          enabled={false}
          onChange={enabled => p.togglePlatform('tiktok', enabled)}
          promptConnectTikTok={true}
        />
      )}

      {customDestinations?.map((dest, ind) => (
        <SingleOutputDestinationSwitcher
          key={ind}
          destination={dest}
          enabled={dest.enabled && !disableCustomDestinationSwitchers}
          onChange={enabled => p.toggleDest(ind, enabled)}
          disabled={disableCustomDestinationSwitchers}
        />
      ))}
    </div>
  );
}

/**
 * Render a single switcher
 */
// disable `func-call-spacing` and `no-spaced-func` rules
// to pass back reference to addClass function
// eslint-disable-next-line
export const SingleOutputDestinationSwitcher = React.forwardRef<{}, ISingleOutputSwitcherProps>(
  (p, ref) => {
    const switchInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const platform = typeof p.destination === 'string' ? (p.destination as TPlatform) : null;

    // Preserving old TikTok functionality, so they can't enable the toggle if TikTok is not
    // connected.
    // TODO: this kind of logic should belong on caller, but ideally we would refactor all this
    const tiktokDisabled =
      platform === 'tiktok' && !Services.StreamingService.views.isPlatformLinked('tiktok');

    function onClickHandler(ev: MouseEvent) {
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

      // If we're disabling the switch we shouldn't be emitting anything past below
      if (p.disabled) {
        ev.stopPropagation();
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
            <SwitchInput
              inputRef={switchInputRef}
              value={p.enabled}
              name={platform}
              disabled={tiktokDisabled}
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
        data-test={platform ? `${platform}-single-output` : 'destination-single-output'}
        className={cx(styles.platformSwitcher, {
          [styles.platformDisabled]: !p.enabled || p.promptConnectTikTok,
        })}
        onClick={ev => {
          ev.stopPropagation();
          onClickHandler(ev);
        }}
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
  },
);
