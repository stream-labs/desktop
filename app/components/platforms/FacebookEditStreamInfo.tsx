import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { cloneDeep } from 'lodash';
import TsxComponent, { createProps } from 'components/tsx-component';

import StreamTitleAndDescription from './StreamTitleAndDescription';
import { ListInput } from '../shared/inputs/inputs';
import { formMetadata, IListOption, metadata } from '../shared/inputs';
import { $t } from '../../services/i18n';
import { FacebookService, IFacebookStartStreamOptions } from '../../services/platforms/facebook';
import { IGoLiveSettings, StreamingService } from '../../services/streaming';

class Props {
  showOnlyRequiredFields? = false;
  goLiveSettings: IGoLiveSettings = null;
  value?: IGoLiveSettings['destinations']['facebook'] = {
    facebookPageId: '',
    title: '',
    game: '',
    enabled: true,
    useCustomTitleAndDescription: false,
  };
}

@Component({ props: createProps(Props) })
export default class FacebookEditStreamInfo extends TsxComponent<Props> {
  @Inject() private facebookService: FacebookService;
  @Inject() private streamingService: StreamingService;
  settings: IFacebookStartStreamOptions = null;

  get twitchGame() {
    return this.props.goLiveSettings.destinations.twitch?.game;
  }

  @Watch('twitchGame')
  private onTwitchGameChanged(game: string) {
    console.log('TW game changed to ', game);
    this.settings.game = game;
    this.emitInput();
  }

  created() {
    this.syncValue(this.value);
  }

  @Watch('value')
  syncValue(val: IGoLiveSettings['destinations']['facebook']) {
    this.settings = cloneDeep(val);
  }

  emitInput() {
    this.$emit('input', this.settings);
  }
  private get formMetadata() {
    return formMetadata({
      page: metadata.list({
        title: $t('Facebook Page'),
        fullWidth: true,
        options: this.facebookService.state.facebookPages.options,
        required: true,
      }),
      game: metadata.text({
        title: $t('Facebook Game'),
        fullWidth: true,
        required: true,
      }),
    });
  }

  render() {
    const showOnlyRequiredFields = this.props.showOnlyRequiredFields;
    return (
      <ValidatedForm onInput={this.emitInput}>
        <HFormGroup title={this.formMetadata.page.title}>
          <ListInput vModel={this.settings.facebookPageId} metadata={this.formMetadata.page} />
        </HFormGroup>

        <HFormGroup metadata={this.formMetadata.game} vModel={this.settings.game} />

        {!showOnlyRequiredFields && (
          <StreamTitleAndDescription vModel={this.settings} allowCustom={true} />
        )}
      </ValidatedForm>
    );
  }
}
