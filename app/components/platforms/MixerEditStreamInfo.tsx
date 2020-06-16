import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import TsxComponent, { createProps } from 'components/tsx-component';

import StreamTitleAndDescription from './StreamTitleAndDescription';
import { IMixerStartStreamOptions, MixerService } from '../../services/platforms/mixer';
import { StreamingService } from '../../app-services';

class Props {}

@Component({ props: createProps(Props) })
export default class MixerEditStreamInfo extends TsxComponent<Props> {
  @Inject() private mixerService: MixerService;
  @Inject() private streamingService: StreamingService;
  channelInfo: IMixerStartStreamOptions = null;

  async created() {
    this.channelInfo = {
      title: '',
      game: '',
    };
  }

  render(createElement: Function) {
    const canShowOnlyRequiredFields = this.streamingService.views.canShowOnlyRequiredFields;
    return (
      !canShowOnlyRequiredFields && (
        <ValidatedForm>
          <StreamTitleAndDescription vModel={this.channelInfo} allowCustom={true} />
        </ValidatedForm>
      )
    );
  }
}
