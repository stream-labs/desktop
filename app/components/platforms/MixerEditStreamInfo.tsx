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

class Props {}

@Component({ props: createProps(Props) })
export default class MixerEditStreamInfo extends TsxComponent<Props> {
  @Inject() private mixerService: MixerService;
  @Inject() private streamingService: StreamingService;
  @SyncWithValue()
  settings: IMixerStartStreamOptions = null;

  private get view() {
    return this.streamingService.views;
  }

  private get metadata() {
    return formMetadata({
      game: metadata.text({ title: $t('Game'), required: true, fullWidth: true }),
    });
  }

  render(createElement: Function) {
    const canShowOnlyRequiredFields = this.view.canShowOnlyRequiredFields;
    return (
      <div>
        {!canShowOnlyRequiredFields && (
          <ValidatedForm>
            <CommonPlatformFields vModel={this.settings} platform="mixer" />
          </ValidatedForm>
        )}
        {/*<HFormGroup metadata={this.metadata.game} vModel={this.settings.game} />*/}
      </div>
    );
  }
}
