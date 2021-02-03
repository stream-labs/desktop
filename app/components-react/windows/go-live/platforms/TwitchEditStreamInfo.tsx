import { canShowOnlyRequiredFields, TSetPlatformSettingsFn } from '../go-live';
import FormSection from '../../../shared/inputs/FormSection';
import CommonPlatformFields from '../CommonPlatformFields';
import React from 'react';
import { TwitchTagsInputVue, GameSelectorVue } from '../../../shared/VueComponent';
import { Services } from '../../../service-provider';
import { TTwitchTag } from '../../../../services/platforms/twitch/tags';
import { IGoLiveSettings } from '../../../../services/streaming';
import { TPlatform } from '../../../../services/platforms';
import { createVModel, TagsInput } from '../../../shared/inputs';
import { $t } from '../../../../services/i18n';
import { Tag } from 'antd';
import { TwitchTagsInput } from './TwitchTagsInput';

interface IProps {
  settings: IGoLiveSettings;
  setPlatformSettings: TSetPlatformSettingsFn;
  setGame: (platform: TPlatform, game: string) => unknown;
}

export function TwitchEditStreamInfo(p: IProps) {
  const { settings, setPlatformSettings, setGame } = p;
  const twSettings = settings.platforms.twitch;
  const showOnlyRequiredFields = canShowOnlyRequiredFields(p.settings);
  const { TwitchService } = Services;
  const platformSettings = settings.platforms.twitch;

  // function setTags(tags: TTwitchTag[]) {
  //   const newPlatformSettings = {
  //     ...platformSettings,
  //     tags,
  //   };
  //   setPlatformSettings('twitch', newPlatformSettings);
  // }

  const vModel = createVModel(twSettings, newTwSettings =>
    setPlatformSettings('twitch', newTwSettings),
  );

  return (
    <FormSection name="twitch-settings">
      {!showOnlyRequiredFields && <CommonPlatformFields {...p} platform="twitch" />}

      {/*<HFormGroup title={$t('Twitch Game')}>*/}
      {/*  <GameSelector vModel={this.settings} platform="twitch" />*/}
      {/*</HFormGroup>*/}
      {/*<GameSelectorVue*/}
      {/*  key={'game-selector'}*/}
      {/*  value={platformSettings.game}*/}
      {/*  platform={'twitch'}*/}
      {/*  settings={settings}*/}
      {/*  onInput={name => setGame('twitch', name)}*/}
      {/*/>*/}

      <TagsInput
        label={$t('Tags Example')}
        tagRender={props => <Tag>{props.label!['props']['data-label']}</Tag>}
        options={[1, 2, 3, 4].map(value => ({
          value: String(value),
          label: `el${value}`,
          title: `elt${value}`,
          template: () => <span data-label={`label-for-${value}`}>tmpl{value}</span>,
        }))}
        value={['2', '3']}
      />

      {!showOnlyRequiredFields && (
        <TwitchTagsInput
          label={$t('Twitch Tags')}
          {...vModel('tags')}
          setPlatformSettings={setPlatformSettings}
          twitchSettings={twSettings}
        />
      )}
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
