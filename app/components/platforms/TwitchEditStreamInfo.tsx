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
import { ListInput } from '../shared/inputs/inputs';
import { IListOption, metadata } from '../shared/inputs';
import { $t } from '../../services/i18n';
import { getPlatformService } from '../../services/platforms';
import { Debounce } from 'lodash-decorators/debounce';
import { IGoLiveSettings, StreamingService } from '../../services/streaming';
import { SyncWithValue } from '../../services/app/app-decorators';

class TwitchEditStreamProps {
  value?: IGoLiveSettings['destinations']['twitch'] = {
    title: '',
    game: '',
    tags: [],
    enabled: true,
    useCustomFields: false,
  };
  // TODO: remove
  onInput?: any;
}

@Component({ components: { TwitchTagsInput }, props: createProps(TwitchEditStreamProps) })
export default class TwitchEditStreamInfo extends TsxComponent<TwitchEditStreamProps> {
  @Inject() private streamingService: StreamingService;
  @Inject() private twitchService: TwitchService;
  @SyncWithValue()
  settings: IGoLiveSettings['destinations']['twitch'] = null;

  private render() {
    const view = this.streamingService.views;
    const canShowOnlyRequiredFields = view.canShowOnlyRequiredFields;
    const isMutliplatformMode = view.isMutliplatformMode;
    return (
      <ValidatedForm>
        {!canShowOnlyRequiredFields && (
          <CommonPlatformFields
            vModel={this.settings}
            onInput={(val: boolean) => console.log('twitch change', val)}
            hasCustomCheckbox={isMutliplatformMode}
            platforms={['twitch']}
          />
        )}
        {!canShowOnlyRequiredFields && (
          <TwitchTagsInput
            tags={this.twitchService.state.availableTags}
            hasPermission={this.twitchService.state.hasUpdateTagsPermission}
            vModel={this.settings.tags}
          />
        )}
      </ValidatedForm>
    );
  }
}
