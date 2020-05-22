import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import TsxComponent, { createProps } from 'components/tsx-component';

import StreamTitleAndDescription from './StreamTitleAndDescription';
import { IMixerStartStreamOptions, MixerService } from '../../services/platforms/mixer';

class Props {
  showOnlyRequiredFields? = false;
}

@Component({ props: createProps(Props) })
export default class MixerEditStreamInfo extends TsxComponent<Props> {
  @Inject() private mixerService: MixerService;
  channelInfo: IMixerStartStreamOptions = null;

  async created() {
    this.channelInfo = {
      title: '',
      game: '',
    };
  }

  render(createElement: Function) {
    return (
      !this.props.showOnlyRequiredFields && (
        <ValidatedForm>
          <StreamTitleAndDescription vModel={this.channelInfo} allowCustom={true} />
        </ValidatedForm>
      )
    );
  }
}
