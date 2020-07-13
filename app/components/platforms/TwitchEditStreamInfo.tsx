import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { cloneDeep } from 'lodash';
import TsxComponent, { createProps } from 'components/tsx-component';

import CommonPlatformFields from './CommonPlatformFields';
import { ITwitchStartStreamOptions, TwitchService } from '../../services/platforms/twitch';
import { TTwitchTag } from '../../services/platforms/twitch/tags';
import TwitchTagsInput from '../shared/inputs/TwitchTagsInput.vue';
import { IGoLiveSettings, IStreamSettings, StreamingService } from '../../services/streaming';
import { SyncWithValue } from '../../services/app/app-decorators';
import BaseEditSteamInfo from './BaseEditSteamInfo';

class TwitchEditStreamProps {
  value?: IStreamSettings;
}

@Component({ components: { TwitchTagsInput }, props: createProps(TwitchEditStreamProps) })
export default class TwitchEditStreamInfo extends BaseEditSteamInfo<TwitchEditStreamProps> {
  @Inject() private streamingService: StreamingService;
  @Inject() private twitchService: TwitchService;
  @SyncWithValue()
  settings: IStreamSettings = null;

  private render() {
    const canShowOnlyRequiredFields = this.canShowOnlyRequiredFields;
    return (
      <ValidatedForm>
        {!canShowOnlyRequiredFields && (
          <CommonPlatformFields vModel={this.settings} platform="twitch" />
        )}
        {!canShowOnlyRequiredFields && (
          <TwitchTagsInput
            tags={this.twitchService.state.availableTags}
            hasPermission={this.twitchService.state.hasUpdateTagsPermission}
            vModel={this.settings.destinations.twitch.tags}
            name={'tags'}
          />
        )}
      </ValidatedForm>
    );
  }
}
