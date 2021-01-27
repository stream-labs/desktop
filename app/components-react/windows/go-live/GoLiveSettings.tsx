import styles from './GoLive.m.less';
import Scrollable from '../../shared/Scrollable';
import PlatformSettings from './PlatformSettings';
import { Services } from '../../service-provider';
import cx from 'classnames';
import React, { HTMLAttributes } from 'react';
import { IGoLiveProps } from './go-live';
import { useVuex } from '../../hooks';
import { DestinationSwitchers } from './DestinationSwitchers';
import { TPlatform } from '../../../services/platforms';
import { $t } from '../../../services/i18n';

/**
 * Renders settings for starting the stream
 * - Platform switchers
 * - Settings for each platform
 * - Extras settings
 **/
export default function GoLiveSettings(p: IGoLiveProps & HTMLAttributes<unknown>) {
  console.log('render GoLiveSettings');
  const {
    StreamingService,
    RestreamService,
    StreamSettingsService,
    SettingsService,
    UserService,
  } = Services;
  const { settings, setSettings } = p;

  // define a reactive state
  const rs = useVuex(() => {
    const view = StreamingService.views;
    const goLiveSettings = view.goLiveSettings;
    const isErrorMode = !!view.info.error;
    const enabledPlatforms = view.enabledPlatforms;
    const isLoadingMode = view.isLoading;
    const linkedPlatformsCnt = view.linkedPlatforms.length;
    return {
      linkedPlatformsCnt,
      isLoadingMode,
      enabledPlatforms,
      shouldShowSettings: !isErrorMode && !isLoadingMode && enabledPlatforms.length,
      isAdvancedMode: goLiveSettings.advancedMode && view.isMultiplatformMode,
      shouldShowPrimeLabel: !RestreamService.state.grandfathered,
      shouldShowLeftCol: StreamSettingsService.state.protectedModeEnabled,
      shouldShowAddDestButton: linkedPlatformsCnt + goLiveSettings.customDestinations.length < 5,
    };
  });

  function switchPlatform(platform: TPlatform, enabled: boolean) {
    // save settings
    settings.platforms[platform].enabled = enabled;
    StreamSettingsService.setGoLiveSettings(settings);

    // preload channel data
    StreamingService.actions.prepopulateInfo();
  }

  function switchCustomDest(destInd: number, enabled: boolean) {
    // save settings
    settings.customDestinations[destInd].enabled = enabled;
    StreamSettingsService.actions.setGoLiveSettings(settings);
  }

  function addDestination() {
    // open the stream settings or prime page
    if (RestreamService.views.canEnableRestream) {
      SettingsService.actions.showSettings('Stream');
    } else {
      UserService.openPrimeUrl('slobs-multistream');
    }
  }

  return (
    <div className={cx('flex', styles.goLiveSettings)}>
      {/*LEFT COLUMN*/}
      {rs.shouldShowLeftCol && (
        <div style={{ width: '400px', marginRight: '42px' }}>
          {/*DESTINATION SWITCHERS*/}
          <DestinationSwitchers
            platforms={settings.platforms}
            customDestinations={settings.customDestinations}
            title="Stream to %{platformName}"
            canDisablePrimary={false}
            onPlatformSwitch={switchPlatform}
            onCustomDestSwitch={switchCustomDest}
          />
          {/*ADD DESTINATION BUTTON*/}
          {rs.shouldShowAddDestButton && (
            <a className={styles.addDestinationBtn} onClick={addDestination}>
              <i className="fa fa-plus" />
              {$t('Add Destination')}{' '}
              {rs.shouldShowPrimeLabel && <b className={styles.prime}>prime</b>}
            </a>
          )}
        </div>
      )}
      {/*RIGHT COLUMN*/}
      <div style={{ width: '100%', display: 'flex' }}>
        {/*{isLoadingMode && this.renderLoading()}*/}
        {/*<GoLiveError />*/}

        {rs.shouldShowSettings && (
          <Scrollable
            className={cx({
              [styles.settingsContainer]: true,
              [styles.settingsContainerOnePlatform]: rs.enabledPlatforms.length === 1,
            })}
          >
            {/*PLATFORM SETTINGS*/}
            <PlatformSettings settings={settings} setSettings={setSettings} />

            {/*ADD SOME SPACE*/}
            {!rs.isAdvancedMode && <div className={styles.spacer} />}

            {/*/!*EXTRAS*!/*/}
            {/*<Section title={isAdvancedMode ? $t('Extras') : ''}>*/}
            {/*  <Twitter*/}
            {/*    vModel={this.settings.tweetText}*/}
            {/*    streamTitle={this.view.getCommonFields(this.settings).title}*/}
            {/*  />*/}
            {/*  <OptimizedProfileSwitcher*/}
            {/*    vModel={this.settings.optimizedProfile}*/}
            {/*    settings={this.settings}*/}
            {/*  />*/}
            {/*</Section>*/}
          </Scrollable>
        )}
      </div>
    </div>
  );
}

// import cx from 'classnames';
// import TsxComponent, { createProps } from 'components/tsx-component';
// import { $t } from 'services/i18n';
// import { Component } from 'vue-property-decorator';
// import styles from './GoLive.m.less';
// import { Inject } from 'services/core';
// import { UserService } from 'services/user';
// import { TPlatform } from 'services/platforms';
// import { SettingsService } from 'services/settings';
// import { IGoLiveSettings, StreamingService } from 'services/streaming';
// import { Spinner } from 'streamlabs-beaker';
// import { StreamSettingsService } from 'services/settings/streaming';
// import ValidatedForm from 'components/shared/inputs/ValidatedForm';
// import PlatformSettings from './PlatformSettings';
// import GoLiveError from './GoLiveError';
// import { SyncWithValue } from 'services/app/app-decorators';
// import { OptimizedProfileSwitcher } from './OptimizedProfileSwitcher';
// import { DestinationSwitchers } from './DestinationSwitchers';
// import { Twitter } from 'components/Twitter';
// import { RestreamService } from 'services/restream';
// import Section from './Section';
// import Scrollable from 'components/shared/Scrollable';
//
// class GoLiveProps {
//   value?: IGoLiveSettings = undefined;
// }
//
// /**
//  * Renders settings for starting the stream
//  * - Platform switchers
//  * - Settings for each platform
//  * - Extras settings
//  **/
// @Component({ props: createProps(GoLiveProps) })
// export default class GoLiveSettings extends TsxComponent<GoLiveProps> {
//   @Inject() private streamingService: StreamingService;
//   @Inject() private streamSettingsService: StreamSettingsService;
//   @Inject() private settingsService: SettingsService;
//   @Inject() private userService: UserService;
//   @Inject() private restreamService: RestreamService;
//   @SyncWithValue() private settings: IGoLiveSettings;
//
//   private get view() {
//     return this.streamingService.views;
//   }
//
//   private switchPlatform(platform: TPlatform, enabled: boolean) {
//     // save settings
//     this.settings.platforms[platform].enabled = enabled;
//     this.streamSettingsService.setGoLiveSettings(this.settings);
//
//     // preload channel data
//     this.streamingService.actions.prepopulateInfo();
//   }
//
//   private switchCustomDest(destInd: number, enabled: boolean) {
//     // save settings
//     this.$set(this.settings.customDestinations, destInd, {
//       ...this.settings.customDestinations[destInd],
//       enabled,
//     });
//     this.streamSettingsService.actions.setGoLiveSettings(this.settings);
//   }
//
//   private addDestination() {
//     // open the stream settings or prime page
//     if (this.restreamService.views.canEnableRestream) {
//       this.settingsService.actions.showSettings('Stream');
//     } else {
//       this.userService.openPrimeUrl('slobs-multistream');
//     }
//   }
//
//   private render() {
//     const view = this.view;
//     const enabledPlatforms = view.enabledPlatforms;
//     const hasPlatforms = enabledPlatforms.length > 0;
//     const isErrorMode = view.info.error;
//     const isLoadingMode = !isErrorMode && ['empty', 'prepopulate'].includes(view.info.lifecycle);
//     const shouldShowSettings = !isErrorMode && !isLoadingMode && hasPlatforms;
//     const isAdvancedMode = view.goLiveSettings.advancedMode && view.isMultiplatformMode;
//     const shouldShowPrimeLabel = !this.restreamService.state.grandfathered;
//     const shouldShowLeftCol = this.streamSettingsService.state.protectedModeEnabled;
//     const onlyOnePlatformIsLinked = view.linkedPlatforms.length === 1;
//     const shouldShowAddDestButton =
//       view.linkedPlatforms.length + view.goLiveSettings.customDestinations.length < 5;
//     return (
//       <ValidatedForm class={cx('flex', styles.goLiveSettings)}>
//         {/*LEFT COLUMN*/}
//         {shouldShowLeftCol && (
//           <div style={{ width: '400px', marginRight: '42px' }}>
//             {/*DESTINATION SWITCHERS*/}
//             <DestinationSwitchers
//               platforms={this.settings.platforms}
//               customDestinations={this.settings.customDestinations}
//               title="Stream to %{platformName}"
//               canDisablePrimary={false}
//               handleOnPlatformSwitch={(...args) => this.switchPlatform(...args)}
//               handleOnCustomDestSwitch={(...args) => this.switchCustomDest(...args)}
//             />
//
//             {/*ADD DESTINATION BUTTON*/}
//             {shouldShowAddDestButton && (
//               <a class={styles.addDestinationBtn} onclick={this.addDestination}>
//                 <i class="fa fa-plus" />
//                 {$t('Add Destination')} {shouldShowPrimeLabel && <b class={styles.prime}>prime</b>}
//               </a>
//             )}
//           </div>
//         )}
//
//         {/*RIGHT COLUMN*/}
//         <div style={{ width: '100%', display: 'flex' }}>
//           {isLoadingMode && this.renderLoading()}
//           <GoLiveError />
//
//           {shouldShowSettings && (
//             <Scrollable
//               className={cx({
//                 [styles.settingsContainer]: true,
//                 [styles.settingsContainerOnePlatform]: onlyOnePlatformIsLinked,
//               })}
//             >
//               {/*PLATFORM SETTINGS*/}
//               <PlatformSettings vModel={this.settings} />
//
//               {/*ADD SOME SPACE*/}
//               {!isAdvancedMode && <div class={styles.spacer} />}
//
//               {/*EXTRAS*/}
//               <Section title={isAdvancedMode ? $t('Extras') : ''}>
//                 <Twitter
//                   vModel={this.settings.tweetText}
//                   streamTitle={this.view.getCommonFields(this.settings).title}
//                 />
//                 <OptimizedProfileSwitcher
//                   vModel={this.settings.optimizedProfile}
//                   settings={this.settings}
//                 />
//               </Section>
//             </Scrollable>
//           )}
//         </div>
//       </ValidatedForm>
//     );
//   }
//
//   private renderLoading() {
//     return <Spinner />;
//   }
// }
