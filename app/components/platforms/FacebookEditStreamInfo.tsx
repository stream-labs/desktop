import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { cloneDeep } from 'lodash';
import TsxComponent, { createProps } from 'components/tsx-component';

import CommonPlatformFields from './CommonPlatformFields';
import { ListInput } from '../shared/inputs/inputs';
import { formMetadata, IListOption, metadata } from '../shared/inputs';
import { $t } from '../../services/i18n';
import { FacebookService, IFacebookStartStreamOptions } from '../../services/platforms/facebook';
import { IGoLiveSettings, StreamingService } from '../../services/streaming';
import { SyncWithValue } from '../../services/app/app-decorators';

class Props {
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
  @SyncWithValue() settings: IFacebookStartStreamOptions = null;

  get view() {
    return this.streamingService.views;
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
    });
  }

  render() {
    const showOnlyRequiredFields = this.streamingService.views.canShowOnlyRequiredFields;
    return (
      <ValidatedForm onInput={this.emitInput}>
        <HFormGroup title={this.formMetadata.page.title}>
          <ListInput vModel={this.settings.facebookPageId} metadata={this.formMetadata.page} />
        </HFormGroup>

        {!showOnlyRequiredFields && (
          <CommonPlatformFields
            vModel={this.settings}
            hasCustomCheckbox={this.view.isMutliplatformMode}
            platforms={['facebook']}
          />
        )}
      </ValidatedForm>
    );
  }
}
