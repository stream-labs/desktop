import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { cloneDeep } from 'lodash';
import TsxComponent, { createProps } from 'components/tsx-component';
import { formMetadata, metadata } from '../../shared/inputs';
import { $t } from '../../../services/i18n';
import BroadcastInput from './BroadcastInput';
import {
  IYoutubeLiveBroadcast,
  IYoutubeStartStreamOptions,
  YoutubeService,
} from 'services/platforms/youtube';
import StreamTitleAndDescription from '../StreamTitleAndDescription';

class YoutubeEditStreamInfoProps {
  showOnlyRequiredFields? = false;
  value?: IYoutubeStartStreamOptions = {
    description: '',
    title: '',
    broadcastId: '',
  };
  canChangeBroadcast = true;
}

@Component({ components: { ValidatedForm }, props: createProps(YoutubeEditStreamInfoProps) })
export default class YoutubeEditStreamInfo extends TsxComponent<YoutubeEditStreamInfoProps> {
  @Inject() private youtubeService: YoutubeService;
  settings: IYoutubeStartStreamOptions = null;
  broadcasts: IYoutubeLiveBroadcast[] = [];
  broadcastsLoaded = false;

  async created() {
    this.settings = cloneDeep(this.props.value);
    this.broadcasts = await this.youtubeService.fetchBroadcasts();
    this.broadcastsLoaded = true;
  }

  @Watch('value')
  syncValue(val: IYoutubeStartStreamOptions) {
    this.settings = cloneDeep(val);
  }

  onSelectBroadcastHandler() {
    // set title and description fields from selected broadcast
    const selectedBroadcast = this.broadcasts.find(
      broadcast => broadcast.id === this.settings.broadcastId,
    );
    if (!selectedBroadcast) return;
    const { title, description } = selectedBroadcast.snippet;
    this.settings.title = title;
    this.settings.description = description;
  }

  get formMetadata() {
    return formMetadata({
      title: metadata.text({
        title: $t('Title'),
        fullWidth: true,
        required: true,
      }),
      description: metadata.textArea({
        title: $t('Description'),
        fullWidth: true,
      }),
      event: {
        broadcasts: this.broadcasts,
        loading: !this.broadcastsLoaded,
        disabled: !this.props.canChangeBroadcast,
      },
    });
  }

  emitInput() {
    this.$emit('input', this.settings);
  }

  render() {
    return (
      !this.props.showOnlyRequiredFields && (
        <ValidatedForm onInput={this.emitInput}>
          {this.props.canChangeBroadcast && (
            <HFormGroup title={$t('Event')}>
              <BroadcastInput
                onInput={this.onSelectBroadcastHandler}
                vModel={this.settings.broadcastId}
                metadata={this.formMetadata.event}
              />
            </HFormGroup>
          )}
          <StreamTitleAndDescription vModel={this.settings} allowCustom={true} />
        </ValidatedForm>
      )
    );
  }
}
