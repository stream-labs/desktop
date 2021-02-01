import { canShowOnlyRequiredFields, TSetPlatformSettingsFn } from '../go-live';
import FormSection from '../../../shared/inputs/FormSection';
import CommonPlatformFields from '../CommonPlatformFields';
import React from 'react';
import { TwitchTagsInputVue, GameSelectorVue } from '../../../shared/VueComponent';
import { Services } from '../../../service-provider';
import { TTwitchTag } from '../../../../services/platforms/twitch/tags';
import { IGoLiveSettings } from '../../../../services/streaming';
import { TPlatform } from '../../../../services/platforms';

interface IProps {
  settings: IGoLiveSettings;
  setPlatformSettings: TSetPlatformSettingsFn;
  setGame: (platform: TPlatform, game: string) => unknown;
}

export function TwitchEditStreamInfo(p: IProps) {
  const { settings, setPlatformSettings, setGame } = p;
  const showOnlyRequiredFields = canShowOnlyRequiredFields(p.settings);
  const { TwitchService } = Services;
  const platformSettings = settings.platforms.twitch;

  function setTags(tags: TTwitchTag[]) {
    const newPlatformSettings = {
      ...platformSettings,
      tags,
    };
    setPlatformSettings('twitch', newPlatformSettings);
  }

  return (
    <FormSection name="twitch-settings">
      {!showOnlyRequiredFields && <CommonPlatformFields {...p} platform="twitch" />}

      {/*<HFormGroup title={$t('Twitch Game')}>*/}
      {/*  <GameSelector vModel={this.settings} platform="twitch" />*/}
      {/*</HFormGroup>*/}
      <GameSelectorVue
        key={'game-selector'}
        value={platformSettings.game}
        platform={'twitch'}
        settings={settings}
        onInput={name => setGame('twitch', name)}
      />

      {/*{!showOnlyRequiredFields && (*/}
      {/*  <TwitchTagsInputVue*/}
      {/*    key={'tags-input'}*/}
      {/*    tags={TwitchService.state.availableTags}*/}
      {/*    hasPermission={TwitchService.state.hasUpdateTagsPermission}*/}
      {/*    value={settings.platforms.twitch.tags}*/}
      {/*    onInput={setTags}*/}
      {/*    name={'tags'}*/}
      {/*  />*/}
      {/*)}*/}
    </FormSection>
  );
}

// import { Component } from 'vue-property-decorator';
// import { Inject } from 'services/core/injector';
// import ValidatedForm from 'components/shared/inputs/ValidatedForm';
// import { createProps } from 'components/tsx-component';
//
// import CommonPlatformFields from '../CommonPlatformFields';
// import { TwitchService } from 'services/platforms/twitch';
// import TwitchTagsInput from 'components/shared/inputs/TwitchTagsInput.vue';
// import { IStreamSettings, StreamingService } from 'services/streaming';
// import { SyncWithValue } from 'services/app/app-decorators';
// import BaseEditSteamInfo from './BaseEditSteamInfo';
// import HFormGroup from '../../../shared/inputs/HFormGroup.vue';
// import { $t } from '../../../../services/i18n';
// import GameSelector from '../GameSelector';
//
// class TwitchEditStreamProps {
//   value?: IStreamSettings;
// }
//
// @Component({ components: { TwitchTagsInput }, props: createProps(TwitchEditStreamProps) })
// export default class TwitchEditStreamInfo extends BaseEditSteamInfo<TwitchEditStreamProps> {
//   @Inject() private streamingService: StreamingService;
//   @Inject() private twitchService: TwitchService;
//   @SyncWithValue() protected settings: IStreamSettings;
//
//   private render() {
//     const canShowOnlyRequiredFields = this.canShowOnlyRequiredFields;
//     return (
//       <ValidatedForm name="twitch-settings">
//         {!canShowOnlyRequiredFields && (
//           <CommonPlatformFields vModel={this.settings} platform="twitch" />
//         )}
//
//         <HFormGroup title={$t('Twitch Game')}>
//           <GameSelector vModel={this.settings} platform="twitch" />
//         </HFormGroup>
//
//         {!canShowOnlyRequiredFields && (
//           <TwitchTagsInput
//             tags={this.twitchService.state.availableTags}
//             hasPermission={this.twitchService.state.hasUpdateTagsPermission}
//             vModel={this.settings.platforms.twitch.tags}
//             name={'tags'}
//           />
//         )}
//       </ValidatedForm>
//     );
//   }
// }
