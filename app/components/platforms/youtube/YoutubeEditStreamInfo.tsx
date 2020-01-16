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
  IYoutubeChannelInfo,
  IYoutubeLiveBroadcast,
  IYoutubeStartStreamOptions,
  YoutubeService,
} from 'services/platforms/youtube';

class YoutubeEditStreamInfoProps {
  value: IYoutubeStartStreamOptions = {
    description: '',
    title: '',
    broadcastId: '',
  };
  canChangeBroadcast = true;
}

@Component({ components: { ValidatedForm }, props: createProps(YoutubeEditStreamInfoProps) })
export default class YoutubeEditStreamInfo extends TsxComponent<YoutubeEditStreamInfoProps> {
  @Inject() private youtubeService: YoutubeService;
  channelInfo: IYoutubeStartStreamOptions = null;
  broadcasts: IYoutubeLiveBroadcast[] = [];
  broadcastsLoaded = false;

  async created() {
    this.channelInfo = cloneDeep(this.props.value);
    this.broadcasts = await this.youtubeService.fetchBroadcasts();
    this.broadcastsLoaded = true;
  }

  @Watch('value')
  syncValue(val: IYoutubeChannelInfo) {
    this.channelInfo = cloneDeep(val);
  }

  onSelectBroadcastHandler() {
    // set title and description fields from selected broadcast
    const selectedBroadcast = this.broadcasts.find(
      broadcast => broadcast.id === this.channelInfo.broadcastId,
    );
    if (!selectedBroadcast) return;
    const { title, description } = selectedBroadcast.snippet;
    this.channelInfo.title = title;
    this.channelInfo.description = description;
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
    this.$emit('input', this.channelInfo);
  }

  render() {
    return (
      this.channelInfo && (
        <ValidatedForm onInput={this.emitInput}>
          {this.props.canChangeBroadcast && (
            <HFormGroup title={$t('Event')}>
              <BroadcastInput
                onInput={this.onSelectBroadcastHandler}
                vModel={this.channelInfo.broadcastId}
                metadata={this.formMetadata.event}
              />
            </HFormGroup>
          )}
          <HFormGroup vModel={this.channelInfo.title} metadata={this.formMetadata.title} />
          <HFormGroup
            vModel={this.channelInfo.description}
            metadata={this.formMetadata.description}
          />
        </ValidatedForm>
      )
    );
  }
}
