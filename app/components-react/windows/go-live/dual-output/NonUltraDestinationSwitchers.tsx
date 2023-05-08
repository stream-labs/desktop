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
import DualOutputPlatformSelector from './DualOutputPlatformSelector';

interface INonUltraDestinationSwitchers {
  showSelector?: boolean;
}

export function NonUltraDestinationSwitchers(p: INonUltraDestinationSwitchers) {
  const {
    // allLinkedPlatforms,
    // linkedPlatforms,
    enabledPlatforms,
    customDestinations,
    switchPlatforms,
    switchCustomDestination,
    isPrimaryPlatform,
    componentView,
  } = useGoLiveSettings();
  const enabledPlatformsRef = useRef(enabledPlatforms);
  enabledPlatformsRef.current = enabledPlatforms;
  const addClassFunctionRef = useRef({ addClass: () => null });
  // const addClassFunctionRef = useRef({ addClass: () => null });

  const emitSwitch = useDebounce(500, () => {
    console.log('enabledPlatformsRef.current 3', enabledPlatformsRef.current);
    switchPlatforms(enabledPlatformsRef.current);

    console.log('switched');
  });

  function isEnabled(platform: TPlatform) {
    console.log(
      'enabledPlatformsRef.current.includes(platform) ',
      enabledPlatformsRef.current.includes(platform),
    );
    return enabledPlatformsRef.current.includes(platform);
  }

  function togglePlatform(platform: TPlatform, enabled: boolean) {
    console.log('platform ', platform);
    enabledPlatformsRef.current = enabledPlatformsRef.current.filter(
      (p: TPlatform) => p !== platform,
    );
    console.log('enabledPlatformsRef.current 1 ', enabledPlatformsRef.current);
    if (enabled) enabledPlatformsRef.current.push(platform);
    console.log('enabledPlatformsRef.current 2 ', enabledPlatformsRef.current);
    emitSwitch();
  }

  console.log('enabledPlatforms platforms ', enabledPlatforms);

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
          ref={addClassFunctionRef}
          key={platform}
          destination={platform}
          enabled={isEnabled(platform)}
          onChange={enabled => togglePlatform(platform, enabled)}
          isPrimary={isPrimaryPlatform(platform)}
        />
      ))}
      {/* {customDestinations?.map((dest, ind) => (
        <DestinationSwitcher
          key={ind}
          destination={dest}
          enabled={customDestinations[ind].enabled}
          onChange={enabled => switchCustomDestination(ind, enabled)}
        />
      ))} */}
      {/* <DualOutputPlatformSelector
        ref={addClassFunctionRef}
        platforms={enabledPlatformsRef.current}
      /> */}

      <DualOutputPlatformSelector
        platforms={enabledPlatformsRef.current}
        togglePlatform={platform => {
          togglePlatform(platform, true);
          addClassFunctionRef.current.addClass();
        }}
      />
    </>
  );
}

interface IDestinationSwitcherProps {
  // ref: React.ForwardedRef<{ addClass: () => void }>;
  destination: TPlatform | ICustomStreamDestination;
  enabled: boolean;
  onChange: (enabled: boolean) => unknown;
  isPrimary?: boolean;
}

/**
 * Render a single switcher card
 */

// disable `func-call-spacing` and `no-spaced-func` rules
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
    // const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const platform = typeof p.destination === 'string' ? (p.destination as TPlatform) : null;
    const { RestreamService, MagicLinkService } = Services;

    function addClass() {
      console.log('adding');
      containerRef.current?.classList.remove(styles.platformDisabled);

      // p.onChange(true);
      // containerRef.current?.classList.add(styles.platformDisabled);
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
      console.log('removing');
      p.onChange(false);
      containerRef.current?.classList.add(styles.platformDisabled);

      // containerRef.current?.classList.remove(styles.platformDisabled);
    }

    // function onClickHandler(ev: MouseEvent) {
    //   if (p.isPrimary) {
    //     alertAsync(
    //       $t(
    //         'You cannot disable the platform you used to sign in to Streamlabs Desktop. Please sign in with a different platform to disable streaming to this destination.',
    //       ),
    //     );
    //     return;
    //   }
    //   if (RestreamService.views.canEnableRestream) {
    //     const enable = !p.enabled;
    //     p.onChange(enable);
    //     // always proxy the click to the SwitchInput
    //     // so it can play a transition animation
    //     // inputRef.current?.click();
    //     // switch the container class without re-rendering to not stop the animation
    //     if (enable) {
    //       containerRef.current?.classList.remove(styles.platformDisabled);
    //     } else {
    //       addClass();
    //     }
    //   } else {
    //     MagicLinkService.actions.linkToPrime('slobs-multistream');
    //   }
    // }

    const { title, description, CloseIcon, Logo } = (() => {
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
          CloseIcon: () => <i className="icon-close" onClick={removeClass} />,
          // CloseIcon: () => <i className="icon-close" ref={inputRef} />,
        };
      } else {
        // define slots for a custom destination switcher
        const destination = p.destination as ICustomStreamDestination;
        return {
          title: destination.name,
          description: destination.url,
          Logo: () => <i className={cx(styles.destinationLogo, 'fa fa-globe')} />,
          CloseIcon: () => <i className="icon-close" onClick={removeClass} />,
          // CloseIcon: () => <i className="icon-close" ref={inputRef} />,
        };
      }
    })();

    const platformKey = title.toLowerCase() as TPlatform;

    return (
      <div
        ref={containerRef}
        className={cx(styles.platformSwitcher, { [styles.platformDisabled]: !p.enabled })}
        onClick={removeClass}
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
            {/* CLOSE */}
            {!p.isPrimary && <CloseIcon />}
          </div>
        </div>
        <div className={styles.platformDisplay}>
          <span className={styles.label}>{`${$t('Output')}:`}</span>
          <DisplaySelector platform={platformKey} nolabel nomargin />
        </div>
      </div>
    );
  },
);

// interface IActionSwitchProps {
//   isPrimary?: boolean | undefined;
//   enabled?: boolean;
//   platform?: TPlatform;
//   destination?: ICustomStreamDestination;
// }

// /**
//  * Render switch or close icon
//  */

// const ActionSwitch = React.forwardRef<HTMLInputElement, IActionSwitchProps>((p, ref) => {
//   const { UserService } = Services;
//   const isPrime = UserService.views.isPrime;

//   if (isPrime) {
//     if (p.platform) {
//       return (
//         <SwitchInput
//           inputRef={ref}
//           value={p.enabled}
//           name={p.platform}
//           disabled={p?.isPrimary}
//           uncontrolled
//           className={styles.platformSwitch}
//           checkedChildren={<i className="icon-check-mark" />}
//         />
//       );
//     } else {
//       const destination = p.destination;
//       return (
//         <SwitchInput
//           inputRef={ref}
//           value={destination?.enabled}
//           name={`destination_${destination?.name}`}
//           uncontrolled
//           className={styles.platformSwitch}
//           checkedChildren={<i className="icon-check-mark" />}
//         />
//       );
//     }
//   } else {
//     if (p.isPrimary) {
//       return <i className="icon-close" ref={ref} />;
//     } else {
//       // return empty div so that the click handler has a reference
//       return <div ref={ref} />;
//     }
//   }
// });
