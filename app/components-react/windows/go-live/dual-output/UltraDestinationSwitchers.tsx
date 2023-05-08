import React, { useRef, useMemo, MouseEvent, ForwardedRef } from 'react';
import { getPlatformService, TPlatform } from 'services/platforms';
import cx from 'classnames';
import { $t } from 'services/i18n';
import styles from './DualOutputGoLive.m.less';
import { ICustomStreamDestination } from 'services/settings/streaming';
import { Services } from 'components-react/service-provider';
import { SwitchInput } from 'components-react/shared/inputs';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import InfoBadge from 'components-react/shared/InfoBadge';
import DisplaySelector from 'components-react/shared/DisplaySelector';
import { assertIsDefined } from 'util/properties-type-guards';
import { useDebounce } from 'components-react/hooks';
import { useGoLiveSettings } from '../useGoLiveSettings';
import { alertAsync } from 'components-react/modals';
import Translate from 'components-react/shared/Translate';

interface IUltraDestinationSwitchers {
  type?: 'default' | 'ultra';
}

/**
 * Allows enabling/disabling platforms and custom destinations for the stream
 */
export function UltraDestinationSwitchers(p: IUltraDestinationSwitchers) {
  const {
    enabledPlatforms,
    customDestinations,
    switchPlatforms,
    switchCustomDestination,
    isPrimaryPlatform,
    componentView,
  } = useGoLiveSettings();
  const enabledPlatformsRef = useRef(enabledPlatforms);
  enabledPlatformsRef.current = enabledPlatforms;

  const emitSwitch = useDebounce(500, (platforms?: TPlatform[]) => {
    if (platforms) {
      enabledPlatformsRef.current = platforms;
      switchPlatforms(platforms);
    } else {
      switchPlatforms(enabledPlatformsRef.current);
    }
  });

  function isEnabled(platform: TPlatform) {
    return enabledPlatformsRef.current.includes(platform);
  }

  function togglePlatform(platform: TPlatform, enabled: boolean) {
    enabledPlatformsRef.current = enabledPlatformsRef.current.filter(
      (p: TPlatform) => p !== platform,
    );
    if (enabled) enabledPlatformsRef.current.push(platform);
    emitSwitch();
  }

  return (
    <>
      <InfoBadge
        content={
          <Translate message="<dualoutput>Dual Output</dualoutput> is enabled - you must stream to one horizontal and one vertical platform.">
            <u slot="dualoutput" />
          </Translate>
        }
        hasMargin={true}
      />
      {enabledPlatforms.map((platform: TPlatform) => (
        <DestinationSwitcher
          key={platform}
          destination={platform}
          enabled={isEnabled(platform)}
          onChange={enabled => togglePlatform(platform, enabled)}
          isPrimary={isPrimaryPlatform(platform)}
        />
      ))}
    </>
  );
}

interface IDestinationSwitcherProps {
  destination: TPlatform | ICustomStreamDestination;
  enabled: boolean;
  onChange: (enabled: boolean) => unknown;
  isPrimary?: boolean;
}

/**
 * Render a single switcher card
 */
function DestinationSwitcher(p: IDestinationSwitcherProps) {
  const switchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const platform = typeof p.destination === 'string' ? (p.destination as TPlatform) : null;
  const { RestreamService, MagicLinkService } = Services;

  function onClickHandler(ev: MouseEvent) {
    if (p.isPrimary) {
      alertAsync(
        $t(
          'You cannot disable the platform you used to sign in to Streamlabs Desktop. Please sign in with a different platform to disable streaming to this destination.',
        ),
      );
      return;
    }
    if (RestreamService.views.canEnableRestream) {
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

  const { title, description, Switch, Logo } = (() => {
    if (platform) {
      const { UserService } = Services;
      // define slots for a platform switcher
      const service = getPlatformService(platform);
      const platformAuthData = UserService.state.auth?.platforms[platform];
      assertIsDefined(platformAuthData);

      return {
        title: service.displayName,
        description: platformAuthData.username,
        Logo: () => (
          <PlatformLogo platform={platform} className={styles[`platform-logo-${platform}`]} />
        ),
        Switch: () => (
          <SwitchInput
            inputRef={switchInputRef}
            value={p.enabled}
            name={platform}
            disabled={p?.isPrimary}
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

  const platformKey = title.toLowerCase() as TPlatform;

  return (
    <div
      ref={containerRef}
      className={cx(styles.platformSwitcher, { [styles.platformDisabled]: !p.enabled })}
      onClick={onClickHandler}
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
          {/* SWITCH */}
          <Switch />
        </div>
      </div>
      <div className={styles.platformDisplay}>
        <span className={styles.label}>{`${$t('Output')}:`}</span>
        <DisplaySelector platform={platformKey} nolabel nomargin />
      </div>
    </div>
  );
}

// interface IActionSwitchProps {
//   isPrimary?: boolean | undefined;
//   enabled?: boolean;
//   platform?: TPlatform;
//   destination?: ICustomStreamDestination;
// }

/**
 * Render switch or close icon
 */

// const ActionSwitch = React.forwardRef<HTMLInputElement, IActionSwitchProps>((p, ref) => {
//   if (p.platform) {
//     return (
//       <SwitchInput
//         inputRef={ref}
//         value={p.enabled}
//         name={p.platform}
//         disabled={p?.isPrimary}
//         uncontrolled
//         className={styles.platformSwitch}
//         checkedChildren={<i className="icon-check-mark" />}
//       />
//     );
//   } else {
//     const destination = p.destination;
//     return (
//       <SwitchInput
//         inputRef={ref}
//         value={destination?.enabled}
//         name={`destination_${destination?.name}`}
//         uncontrolled
//         className={styles.platformSwitch}
//         checkedChildren={<i className="icon-check-mark" />}
//       />
//     );
//   }
// });
