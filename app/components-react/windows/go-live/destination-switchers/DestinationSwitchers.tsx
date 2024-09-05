import React, { useRef, useCallback } from 'react';
import { TPlatform } from 'services/platforms';
import { useDebounce } from '../../../hooks';
import { useGoLiveSettings } from '../useGoLiveSettings';
import { SingleOutputDestinationSwitchers } from './SingleOutputDestinationSwitcher';
import { DualOutputDestinationSwitchers } from './DualOutputDestinationSwitchers';

/**
 * Allows enabling/disabling platforms and custom destinations for the stream
 */
export function DestinationSwitchers() {
  const {
    enabledPlatforms,
    enabledDestinations,
    isRestreamEnabled,
    isDualOutputMode,
    isEnabled,
    switchPlatforms,
    switchCustomDestination,
  } = useGoLiveSettings();
  // use these references to apply debounce
  // for error handling and switch animation
  const enabledPlatformsRef = useRef(enabledPlatforms);
  enabledPlatformsRef.current = enabledPlatforms;
  const enabledDestRef = useRef(enabledDestinations);
  enabledDestRef.current = enabledDestinations;

  const emitSwitch = useDebounce(500, (ind?: number, enabled?: boolean) => {
    if (ind !== undefined && enabled !== undefined) {
      switchCustomDestination(ind, enabled);
    } else {
      switchPlatforms(enabledPlatformsRef.current);
    }
  });

  const isTargetEnabled = useCallback((target: TPlatform | number) => {
    if (typeof target === 'number') {
      return enabledDestRef.current.includes(target);
    } else {
      if (target === 'tiktok' && isEnabled('tiktok')) {
        return false;
      }

      return enabledPlatformsRef.current.includes(target);
    }
  }, []);

  const togglePlatform = useCallback((platform: TPlatform, enabled: boolean) => {
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
        enabledPlatformsRef.current = enabled
          ? enabledPlatformsRef.current
          : enabledPlatformsRef.current.filter(platform => platform !== 'tiktok');
      } else {
        /*
         * Clearing this list ensures that when a new platform is selected, instead of enabling 2 platforms
         * we switch to 1 enabled platforms that was just toggled.
         * We will also preserve TikTok as an active platform if it was before.
         */
        enabledPlatformsRef.current = enabledPlatformsRef.current.includes('tiktok')
          ? ['tiktok']
          : [];

        /**
         * Also toggle off any enabled custom destinations
         */
        enabledDestRef.current.forEach(ind => toggleDest(ind, false));
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
  }, []);

  const toggleDest = useCallback((ind: number, enabled: boolean) => {
    if (enabled) {
      enabledDestRef.current.push(ind);
    } else {
      enabledDestRef.current = enabledDestRef.current.filter(index => index !== ind);
    }
    emitSwitch(ind, enabled);
  }, []);

  return (
    <div id="dest-switchers">
      {!isDualOutputMode && (
        <SingleOutputDestinationSwitchers
          isEnabled={isTargetEnabled}
          togglePlatform={togglePlatform}
          toggleDest={toggleDest}
        />
      )}

      {isDualOutputMode && (
        <DualOutputDestinationSwitchers isEnabled={isTargetEnabled} toggleDest={toggleDest} />
      )}
    </div>
  );
}

// import React, { useRef, useCallback } from 'react';
// import { getPlatformService, TPlatform } from 'services/platforms';
// import { useDebounce } from '../../../hooks';
// import { useGoLiveSettings } from '../useGoLiveSettings';
// import cx from 'classnames';
// import styles from './DestinationSwitchers.m.less';
// import { ICustomStreamDestination } from 'services/settings/streaming';
// import { Services } from 'components-react/service-provider';
// import { alertAsync } from 'components-react/modals';
// import { $t } from 'services/i18n';
// import PlatformLogo from 'components-react/shared/PlatformLogo';
// import { SwitchInput } from 'components-react/shared/inputs';
// import DisplaySelector from 'components-react/shared/DisplaySelector';
// import DestinationSelector from '../destination-selector/DestinationSelector';

// interface ISingleOutputSwitcherProps {
//   destination: TPlatform | ICustomStreamDestination;
//   enabled: boolean;
//   onChange: (enabled: boolean) => unknown;
//   isPrimary?: boolean;
//   promptConnectTikTok?: boolean;
//   disabled?: boolean;
// }

// interface IDualOutputSwitcherProps extends ISingleOutputSwitcherProps {
//   index: number;
//   canDisablePrimary?: boolean;
//   togglePlatform?: (platform: TPlatform) => void;
// }

// /**
//  * Allows enabling/disabling platforms and custom destinations for the stream
//  */
// export function DestinationSwitchers() {
//   const {
//     enabledPlatforms,
//     enabledDestinations,
//     isRestreamEnabled,
//     isDualOutputMode,
//     isPrime,
//     linkedPlatforms,
//     customDestinations,
//     promptConnectTikTok,
//     isTikTokEnabled,
//     disableCustomDestinationSwitchers,
//     showSelector,
//     switchPlatforms,
//     switchCustomDestination,
//     isPrimaryPlatform,
//   } = useGoLiveSettings().extend(module => {
//     return {
//       get promptConnectTikTok() {
//         return !module.isPlatformLinked('tiktok');
//       },

//       get isTikTokEnabled() {
//         return module.isEnabled('tiktok');
//       },

//       get disableCustomDestinationSwitchers() {
//         // Multistream users can always add destinations
//         if (module.isRestreamEnabled) {
//           return false;
//         }

//         const maxAddlPlatforms = module.isPrimaryPlatform('tiktok') ? 1 : 0;

//         // Otherwise, only a single platform and no custom destinations,
//         // TikTok should be handled by platform switching
//         return module.enabledPlatforms.length > maxAddlPlatforms;
//       },

//       // non-ultra users can stream to a combined two platforms/destinations
//       get showSelector() {
//         const numCustomDestinations = module.state.customDestinations.filter(
//           destination => destination.enabled,
//         ).length;
//         const numEnabledPlatforms = module.state.enabledPlatforms.length;

//         return numCustomDestinations + numEnabledPlatforms < 2;
//       },

//       isPrimaryPlatform(platform: TPlatform) {
//         return module.isPrimaryPlatform(platform) || linkedPlatforms.length === 1;
//       },
//     };
//   });

//   // use these references to apply debounce
//   // for error handling and switch animation
//   const enabledPlatformsRef = useRef(enabledPlatforms);
//   enabledPlatformsRef.current = enabledPlatforms;
//   const enabledDestRef = useRef(enabledDestinations);
//   enabledDestRef.current = enabledDestinations;
//   const destinationSwitcherRef = useRef({ addClass: () => undefined });

//   const platforms = isPrime ? linkedPlatforms : enabledPlatforms;
//   const destinations = isPrime
//     ? customDestinations
//     : customDestinations.filter(destination => destination.enabled);
//   const id = isPrime ? 'ultra-switchers' : 'non-ultra-switchers';

//   const emitSwitch = useDebounce(500, (ind?: number, enabled?: boolean) => {
//     if (ind !== undefined && enabled !== undefined) {
//       switchCustomDestination(ind, enabled);
//     } else {
//       switchPlatforms(enabledPlatformsRef.current);
//     }
//   });

//   const isEnabled = useCallback((target: TPlatform | number, promptConnectTikTok?: boolean) => {
//     if (typeof target === 'number') {
//       return enabledDestRef.current.includes(target);
//     } else {
//       if (target === 'tiktok' && promptConnectTikTok) {
//         return false;
//       }

//       return enabledPlatformsRef.current.includes(target);
//     }
//   }, []);

//   const toggleSingleOutputPlatform = useCallback((platform: TPlatform, enabled: boolean) => {
//     // On non multistream mode, switch the platform that was just selected while disabling all the others,
//     // allow TikTok to be added as an extra platform
//     if (!isRestreamEnabled) {
//       /*
//        * If TikTok is the platform being toggled:
//        * - Preserve the currently active platform so TikTok can be added to this list at the bottom of this function,
//        *   we will have 2 active platforms and a Primary Chat switcher.
//        * - Remove TikTok from the list without removing the other active platform if we're disabling TikTok itself.
//        */
//       if (platform === 'tiktok') {
//         enabledPlatformsRef.current = enabled
//           ? enabledPlatformsRef.current
//           : enabledPlatformsRef.current.filter(platform => platform !== 'tiktok');
//       } else {
//         /*
//          * Clearing this list ensures that when a new platform is selected, instead of enabling 2 platforms
//          * we switch to 1 enabled platforms that was just toggled.
//          * We will also preserve TikTok as an active platform if it was before.
//          */
//         enabledPlatformsRef.current = enabledPlatformsRef.current.includes('tiktok')
//           ? ['tiktok']
//           : [];

//         /**
//          * Also toggle off any enabled custom destinations
//          */
//         enabledDestRef.current.forEach(ind => toggleDest(ind, false));
//       }
//     } else {
//       enabledPlatformsRef.current = enabledPlatformsRef.current.filter(p => p !== platform);
//     }

//     if (enabled) {
//       enabledPlatformsRef.current.push(platform);
//     }

//     // Do not allow disabling the last platform
//     if (!enabledPlatformsRef.current.length) {
//       enabledPlatformsRef.current.push(platform);
//     }

//     emitSwitch();
//   }, []);

//   const toggleDualOutputPlatform = useCallback((platform: TPlatform, enabled: boolean) => {
//     enabledPlatformsRef.current = enabledPlatformsRef.current.filter(
//       (p: TPlatform) => p !== platform,
//     );
//     if (enabled) enabledPlatformsRef.current.push(platform);
//     emitSwitch();
//   }, []);

//   const toggleDest = useCallback((ind: number, enabled: boolean) => {
//     if (enabled) {
//       enabledDestRef.current.push(ind);
//     } else {
//       enabledDestRef.current = enabledDestRef.current.filter(index => index !== ind);
//     }
//     emitSwitch(ind, enabled);
//   }, []);

//   return (
//     <div id="dest-switchers">
//       {!isDualOutputMode && (
//         <div id="single-output-switchers">
//           {linkedPlatforms.map(platform => (
//             <SingleOutputDestinationSwitcher
//               key={platform}
//               destination={platform}
//               enabled={isEnabled(platform, promptConnectTikTok)}
//               onChange={enabled => toggleSingleOutputPlatform(platform, enabled)}
//               promptConnectTikTok={false}
//               isPrimary={isPrimaryPlatform(platform)}
//             />
//           ))}

//           {!linkedPlatforms.includes('tiktok') && (
//             <SingleOutputDestinationSwitcher
//               destination={'tiktok'}
//               enabled={isTikTokEnabled}
//               onChange={enabled => toggleSingleOutputPlatform('tiktok', enabled)}
//               isPrimary={isPrimaryPlatform('tiktok')}
//               promptConnectTikTok={promptConnectTikTok}
//             />
//           )}

//           {customDestinations?.map((dest, ind) => (
//             <SingleOutputDestinationSwitcher
//               key={ind}
//               destination={dest}
//               enabled={dest.enabled && !disableCustomDestinationSwitchers}
//               onChange={enabled => toggleDest(ind, enabled)}
//               disabled={disableCustomDestinationSwitchers}
//             />
//           ))}
//         </div>
//       )}

//       {isDualOutputMode && (
//         <div id={id} className={styles.dualOutputSwitchers}>
//           {platforms.map((platform: TPlatform, index: number) => (
//             <DualOutputDestinationSwitcher
//               key={platform}
//               destination={platform}
//               enabled={isEnabled(platform, promptConnectTikTok)}
//               onChange={enabled => toggleSingleOutputPlatform(platform, enabled)}
//               isPrimary={isPrimaryPlatform(platform)}
//               promptConnectTikTok={platform === 'tiktok' && promptConnectTikTok}
//               canDisablePrimary={isRestreamEnabled}
//               index={index}
//             />
//           ))}

//           {destinations.map((destination, ind) => (
//             <DualOutputDestinationSwitcher
//               key={`dest-${ind}`}
//               destination={destination}
//               enabled={customDestinations[ind].enabled}
//               onChange={enabled => toggleDest(ind, enabled)}
//               index={ind}
//             />
//           ))}

//           {!isPrime && showSelector && (
//             <DestinationSelector
//               togglePlatform={(platform: TPlatform) => {
//                 toggleSingleOutputPlatform(platform, true);
//                 destinationSwitcherRef.current.addClass();
//               }}
//               showSwitcher={destinationSwitcherRef.current.addClass}
//               switchDestination={(index: number) => {
//                 switchCustomDestination(index, true);
//                 destinationSwitcherRef.current.addClass();
//               }}
//             />
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// /**
//  * Render a single switcher
//  */
// // disable `func-call-spacing` and `no-spaced-func` rules
// // to pass back reference to addClass function
// // eslint-disable-next-line
// export const SingleOutputDestinationSwitcher = React.forwardRef<{}, ISingleOutputSwitcherProps>(
//   (p, ref) => {
//     const switchInputRef = useRef<HTMLInputElement>(null);
//     const containerRef = useRef<HTMLDivElement>(null);
//     const platform = typeof p.destination === 'string' ? (p.destination as TPlatform) : null;
//     const { RestreamService, MagicLinkService, StreamingService } = Services;
//     const canEnableRestream = RestreamService.views.canEnableRestream;
//     const cannotDisableDestination = p.isPrimary && !canEnableRestream;

//     // Preserving old TikTok functionality, so they can't enable the toggle if TikTok is not
//     // connected.
//     // TODO: this kind of logic should belong on caller, but ideally we would refactor all this
//     const tiktokDisabled =
//       platform === 'tiktok' && !StreamingService.views.isPlatformLinked('tiktok');

//     function onClickHandler() {
//       if (p.promptConnectTikTok) {
//         alertAsync({
//           type: 'confirm',
//           title: $t('Connect TikTok Account'),
//           closable: true,
//           content: (
//             <span>
//               {$t(
//                 'Connect your TikTok account to stream to TikTok and one additional platform for free.',
//               )}
//             </span>
//           ),
//           okText: $t('Connect'),
//           onOk: () => {
//             Services.NavigationService.actions.navigate('PlatformMerge', { platform: 'tiktok' });
//             Services.WindowsService.actions.closeChildWindow();
//           },
//         });
//         return;
//       }

//       // If we're disabling the switch we shouldn't be emitting anything past below
//       if (p.disabled) {
//         return;
//       }

//       const enable = !p.enabled;
//       p.onChange(enable);
//       // always proxy the click to the SwitchInput
//       // so it can play a transition animation
//       switchInputRef.current?.click();

//       /*
//        * TODO:
//        *   this causes inconsistent state when disabling primary platform
//        *   after is being re-enabled. Not sure which animation is referring to.
//        */
//       // switch the container class without re-rendering to not stop the animation
//       /*
//     if (enable) {
//       containerRef.current?.classList.remove(styles.platformDisabled);
//     } else {
//       containerRef.current?.classList.add(styles.platformDisabled);
//     }
//     */
//     }

//     function addClass() {
//       containerRef.current?.classList.remove(styles.platformDisabled);
//     }

//     function removeClass() {
//       if (p.isPrimary) {
//         alertAsync(
//           $t(
//             'You cannot disable the platform you used to sign in to Streamlabs Desktop. Please sign in with a different platform to disable streaming to this destination.',
//           ),
//         );
//         return;
//       }
//       p.onChange(false);
//       containerRef.current?.classList.add(styles.platformDisabled);
//     }

//     const { title, description, Switch, Logo } = (() => {
//       if (platform) {
//         // define slots for a platform switcher
//         const { UserService, StreamingService } = Services;
//         const service = getPlatformService(platform);
//         const platformAuthData = UserService.state.auth?.platforms[platform];
//         const username = platformAuthData?.username ?? '';

//         return {
//           title: $t('Stream to %{platformName}', { platformName: service.displayName }),
//           description: username,
//           Logo: () => (
//             <PlatformLogo platform={platform} className={styles[`platform-logo-${platform}`]} />
//           ),
//           Switch: () => (
//             <SwitchInput
//               inputRef={switchInputRef}
//               value={p.enabled}
//               name={platform}
//               disabled={tiktokDisabled}
//               uncontrolled
//             />
//           ),
//         };
//       } else {
//         // define slots for a custom destination switcher
//         const destination = p.destination as ICustomStreamDestination;
//         return {
//           title: destination.name,
//           description: destination.url,
//           Logo: () => <i className={cx(styles.destinationLogo, 'fa fa-globe')} />,
//           Switch: () => (
//             <SwitchInput
//               inputRef={switchInputRef}
//               value={destination.enabled}
//               name={`destination_${destination.name}`}
//               disabled={p.disabled}
//               uncontrolled
//             />
//           ),
//         };
//       }
//     })();

//     return (
//       <div
//         ref={containerRef}
//         data-test={platform ? 'platform-single-output' : 'destination-single-output'}
//         className={cx(styles.platformSwitcher, {
//           [styles.platformDisabled]: !p.enabled || p.promptConnectTikTok,
//         })}
//         onClick={onClickHandler}
//       >
//         <div className={cx(styles.colInput)}>
//           <Switch />
//         </div>

//         {/* PLATFORM LOGO */}
//         <div className="logo margin-right--20">
//           <Logo />
//         </div>

//         {/* PLATFORM TITLE AND ACCOUNT/URL */}
//         <div className={styles.colAccount}>
//           <span className={styles.platformName}>{title}</span> <br />
//           {description} <br />
//         </div>
//       </div>
//     );
//   },
// );

// /**
//  * Render a single switcher card
//  */

// // disable `func-call-spacing` and `no-spaced-func` rules
// // to pass back reference to addClass function
// // eslint-disable-next-line
// const DualOutputDestinationSwitcher = React.forwardRef<
//   // eslint-disable-next-line
//   { addClass: () => void },
//   IDualOutputSwitcherProps
// >((p, ref) => {
//   React.useImperativeHandle(ref, () => {
//     return {
//       addClass() {
//         addClass();
//       },
//     };
//   });
//   const switchInputRef = useRef<HTMLInputElement>(null);
//   const containerRef = useRef<HTMLDivElement>(null);

//   const { RestreamService, MagicLinkService, UserService } = Services;

//   const platform = typeof p.destination === 'string' ? (p.destination as TPlatform) : null;
//   const enable = !p.enabled ?? (p.promptConnectTikTok && p.promptConnectTikTok === true);
//   const canDisable = p.canDisablePrimary;
//   const isPrime = Services.UserService.views.isPrime;

//   function addClass() {
//     containerRef.current?.classList.remove(styles.platformDisabled);
//   }

//   function removeClass() {
//     if (canDisable) {
//       alertAsync(
//         $t(
//           'You cannot disable the platform you used to sign in to Streamlabs Desktop. Please sign in with a different platform to disable streaming to this destination.',
//         ),
//       );
//       return;
//     }

//     p.onChange(false);
//     containerRef.current?.classList.add(styles.platformDisabled);
//   }

//   function showTikTokConnectModal() {
//     alertAsync({
//       type: 'confirm',
//       title: $t('Connect TikTok Account'),
//       closable: true,
//       content: (
//         <span>
//           {$t(
//             'Connect your TikTok account to stream to TikTok and one additional platform for free.',
//           )}
//         </span>
//       ),
//       okText: $t('Connect'),
//       onOk: () => {
//         Services.NavigationService.actions.navigate('PlatformMerge', { platform: 'tiktok' });
//         Services.WindowsService.actions.closeChildWindow();
//       },
//     });
//   }

//   function onClickHandler() {
//     // TODO: do we need this check if we're on an Ultra DestinationSwitcher
//     if (p.isPrimary && p.canDisablePrimary !== true) {
//       alertAsync(
//         $t(
//           'You cannot disable the platform you used to sign in to Streamlabs Desktop. Please sign in with a different platform to disable streaming to this destination.',
//         ),
//       );
//       return;
//     }

//     if (RestreamService.views.canEnableRestream && !p.promptConnectTikTok) {
//       p.onChange(enable);
//       // always proxy the click to the SwitchInput
//       // so it can play a transition animation
//       switchInputRef.current?.click();
//       // switch the container class without re-rendering to not stop the animation
//       if (enable) {
//         containerRef.current?.classList.remove(styles.platformDisabled);
//       } else {
//         containerRef.current?.classList.add(styles.platformDisabled);
//       }
//     } else {
//       MagicLinkService.actions.linkToPrime('slobs-multistream');
//     }
//   }

//   const { title, description, Controller, Logo } = (() => {
//     if (platform) {
//       const { UserService } = Services;
//       // define slots for a platform switcher
//       const service = getPlatformService(platform);
//       const platformAuthData = UserService.state.auth?.platforms[platform] ?? {
//         username: '',
//       };
//       const username = platformAuthData?.username ?? '';

//       return {
//         title: service.displayName,
//         description: username,
//         Logo: () => (
//           <PlatformLogo
//             platform={platform}
//             className={cx(styles.logo, styles[`platform-logo-${platform}`])}
//             size={36}
//           />
//         ),
//         Controller: () =>
//           isPrime ? (
//             <Switch
//               inputRef={switchInputRef}
//               value={p.enabled}
//               name={platform}
//               disabled={
//                 p.canDisablePrimary
//                   ? false
//                   : p?.isPrimary || (p.promptConnectTikTok && platform === 'tiktok')
//               }
//             />
//           ) : (
//             <CloseIcon removeClass={removeClass} isPrimary={p?.isPrimary} />
//           ),
//       };
//     } else {
//       // define slots for a custom destination switcher
//       const destination = p.destination as ICustomStreamDestination;
//       return {
//         title: destination.name,
//         description: destination.url,
//         Logo: () => <i className={cx(styles.destinationLogo, 'fa fa-globe')} />,
//         Controller: () =>
//           isPrime ? (
//             <Switch
//               inputRef={switchInputRef}
//               value={destination?.enabled}
//               name={`destination_${destination?.name}`}
//             />
//           ) : (
//             <CloseIcon removeClass={removeClass} isPrimary={p?.isPrimary} />
//           ),
//       };
//     }
//   })();

//   return (
//     <div
//       ref={containerRef}
//       data-test={platform ? 'platform-dual-output' : 'destination-dual-output'}
//       className={cx(styles.dualOutputPlatformSwitcher, {
//         [styles.platformDisabled]: !p.enabled || p.promptConnectTikTok,
//       })}
//       onClick={() => {
//         if (p.promptConnectTikTok) {
//           showTikTokConnectModal();
//         }
//       }}
//     >
//       <div className={styles.dualOutputPlatformInfo}>
//         {/* LOGO */}
//         <Logo />
//         {/* INFO */}
//         <div className={styles.colAccount}>
//           <span className={styles.platformName}>{title}</span>
//           <span className={styles.platformUsername}>{description}</span>
//         </div>
//         {/* SWITCH */}
//         <div
//           className={cx(styles.colInput)}
//           onClick={e => {
//             if (!UserService.views.isPrime) return;

//             if (p.promptConnectTikTok) {
//               showTikTokConnectModal();
//               e.stopPropagation();
//               return;
//             } else {
//               onClickHandler();
//             }
//           }}
//         >
//           <Controller />
//         </div>
//       </div>

//       <DisplaySelector
//         title={title}
//         className={styles.dualOutputDisplaySelector}
//         platform={platform}
//         label={$t('Output')}
//         index={p.index}
//       />
//     </div>
//   );
// });

// function CloseIcon(p: { removeClass: () => void; isPrimary?: boolean }) {
//   return p?.isPrimary ? (
//     <></>
//   ) : (
//     <i
//       className={cx('icon-close', styles.close)}
//       onClick={e => {
//         e.stopPropagation();
//         p.removeClass();
//       }}
//     />
//   );
// }

// function Switch(p: { inputRef: any; name: string; value: boolean; disabled?: boolean }) {
//   return (
//     <SwitchInput
//       inputRef={p.inputRef}
//       value={p.value}
//       name={p.name}
//       uncontrolled
//       nolabel
//       className={styles.dualOutputPlatformSwitch}
//       checkedChildren={<i className="icon-check-mark" />}
//       disabled={p.disabled}
//     />
//   );
// }
