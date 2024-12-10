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
import { ModalLayout } from 'components-react/shared/ModalLayout';
import { Button, Form, Modal } from 'antd';

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
    isRestreamEnabled,
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

  const shouldDisableCustomDestinationSwitchers = () => {
    // Multistream users can always add destinations
    if (isRestreamEnabled) {
      return false;
    }

    // Otherwise, only a single platform and no custom destinations,
    // TikTok should be handled by platform switching
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
      if (target === 'tiktok' && promptConnectTikTok) {
        return false;
      }

      return enabledPlatformsRef.current.includes(target);
    }
  }

  function togglePlatform(platform: TPlatform, enabled: boolean) {
    // On non multistream mode, switch the platform that was just selected while disabling all the others,
    // allow TikTok to be added as an extra platform
    if (!isRestreamEnabled) {
      /*
       * If TikTok is the platform being toggled:
       * - Preserve the currently active platform so TikTok can be added to this list at the bottom of this function,
       *   we will have 2 active platforms and a Primary Chat switcher.
       * - Remove TikTok from the list without removing the other active platform if we're disabling TikTok itself.
       */
      if (platform === 'tiktok') {
        if (enabled) {
          /*
           * If we had two platforms, none of which were tiktok, we still need to limit
           * that to 1 platform without restreaming.
           * This could happen when coming from having dual output enabled to off.
           */
          enabledPlatformsRef.current = enabledPlatformsRef.current.slice(0, 1);
        } else {
          enabledPlatformsRef.current = enabledPlatformsRef.current.filter(
            platform => platform !== 'tiktok',
          );
        }
      } else {
        /*
         * Clearing this list ensures that when a new platform is selected, instead of enabling 2 platforms
         * we switch to 1 enabled platforms that was just toggled.
         * We will also preserve TikTok as an active platform if it was before.
         */
        enabledPlatformsRef.current = enabledPlatformsRef.current.includes('tiktok')
          ? ['tiktok']
          : [];
      }
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
    <div className={cx(styles.switchWrapper, styles.columnPadding)}>
      {linkedPlatforms.map(platform => (
        <DestinationSwitcher
          key={platform}
          destination={platform}
          enabled={isEnabled(platform)}
          onChange={enabled => togglePlatform(platform, enabled)}
          promptConnectTikTok={platform === 'tiktok' && promptConnectTikTok}
          isPrimary={isPrimaryPlatform(platform)}
        />
      ))}

      {!linkedPlatforms.includes('tiktok') && (
        <DestinationSwitcher
          destination={'tiktok'}
          enabled={isEnabled('tiktok')}
          onChange={enabled => togglePlatform('tiktok', enabled)}
          isPrimary={isPrimaryPlatform('tiktok')}
          promptConnectTikTok={promptConnectTikTok}
        />
      )}

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
    if (p.promptConnectTikTok) {
      alertAsync({
        bodyStyle: { padding: '24px' },
        className: styles.tiktokModal,
        type: 'confirm',
        title: $t('Connect your TikTok Account'),
        content: $t(
          'Connect your TikTok account to stream to TikTok and one additional platform for free.',
        ),
        icon: <PlatformLogo platform="tiktok" className={styles.tiktokModalLogo} />,
        closable: true,
        maskClosable: true,
        cancelButtonProps: { style: { display: 'none' } },
        okButtonProps: { style: { display: 'none' } },
        modalRender: node => <ModalLayout footer={<ModalFooter />}>{node}</ModalLayout>,
        width: 600,
      });
    }

    // If we're disabling the switch we shouldn't be emitting anything past below
    if (p.disabled) {
      return;
    }

    const enable = !p.enabled;
    p.onChange(enable);
    // always proxy the click to the SwitchInput
    // so it can play a transition animation
    switchInputRef.current?.click();

    /*
     * TODO:
     *   this causes inconsistent state when disabling primary platform
     *   after is being re-enabled. Not sure which animation is referring to.
     */
    // switch the container class without re-rendering to not stop the animation
    /*
    if (enable) {
      containerRef.current?.classList.remove(styles.platformDisabled);
    } else {
      containerRef.current?.classList.add(styles.platformDisabled);
    }
    */
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

function ModalFooter() {
  function connect() {
    Modal.destroyAll();
    Services.NavigationService.actions.navigate('PlatformMerge', { platform: 'tiktok' });
    Services.WindowsService.actions.closeChildWindow();
  }

  return (
    <Form layout={'inline'} className={styles.tiktokModalFooter}>
      <Button onClick={Modal.destroyAll}>{$t('Skip')}</Button>
      <Button type="primary" onClick={connect}>
        {$t('Connect')}
      </Button>
    </Form>
  );
}
