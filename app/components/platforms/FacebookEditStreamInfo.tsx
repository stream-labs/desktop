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
import { IGoLiveSettings, IStreamSettings, StreamingService } from '../../services/streaming';
import { SyncWithValue } from '../../services/app/app-decorators';
import BaseEditSteamInfo from './BaseEditSteamInfo';

class Props {
  value?: IStreamSettings = null;
}

@Component({ props: createProps(Props) })
export default class FacebookEditStreamInfo extends BaseEditSteamInfo<Props> {
  @Inject() private facebookService: FacebookService;
  @Inject() private streamingService: StreamingService;
  @SyncWithValue() settings: IStreamSettings = null;

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
    const showOnlyRequiredFields = this.canShowOnlyRequiredFields;
    return (
      <ValidatedForm onInput={this.emitInput}>
        <HFormGroup title={this.formMetadata.page.title}>
          <ListInput
            vModel={this.settings.destinations.facebook.facebookPageId}
            metadata={this.formMetadata.page}
          />
        </HFormGroup>

        {!showOnlyRequiredFields && (
          <CommonPlatformFields vModel={this.settings} platform={'facebook'} />
        )}
      </ValidatedForm>
    );
  }
}
