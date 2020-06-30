import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import TsxComponent, { createProps } from 'components/tsx-component';

import CommonPlatformFields from './CommonPlatformFields';
import { IMixerStartStreamOptions, MixerService } from '../../services/platforms/mixer';
import { StreamingService } from '../../app-services';
import { SyncWithValue } from '../../services/app/app-decorators';
import HFormGroup from '../shared/inputs/HFormGroup.vue';
import { formMetadata, metadata } from '../shared/inputs';
import { $t } from '../../services/i18n';
import BaseEditSteamInfo from './BaseEditSteamInfo';
import { IStreamSettings } from '../../services/streaming';

class Props {}

@Component({ props: createProps(Props) })
export default class MixerEditStreamInfo extends BaseEditSteamInfo<Props> {
  @Inject() private mixerService: MixerService;
  @Inject() private streamingService: StreamingService;
  @SyncWithValue()
  protected settings: IStreamSettings = null;

  render(createElement: Function) {
    return (
      <div>
        {!this.canShowOnlyRequiredFields && (
          <ValidatedForm>
            <CommonPlatformFields vModel={this.settings} platform="mixer" />
          </ValidatedForm>
        )}
      </div>
    );
  }
}
