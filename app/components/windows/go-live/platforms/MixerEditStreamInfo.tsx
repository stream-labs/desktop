import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import { createProps } from 'components/tsx-component';
import CommonPlatformFields from '../CommonPlatformFields';
import { MixerService } from 'services/platforms/mixer';
import { StreamingService, IStreamSettings } from 'services/streaming';
import { SyncWithValue } from 'services/app/app-decorators';
import BaseEditSteamInfo from './BaseEditSteamInfo';

class Props {}

@Component({ props: createProps(Props) })
export default class MixerEditStreamInfo extends BaseEditSteamInfo<Props> {
  @Inject() private mixerService: MixerService;
  @Inject() private streamingService: StreamingService;
  @SyncWithValue() protected settings: IStreamSettings;

  render() {
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
