import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { createProps } from 'components/tsx-component';
import CommonPlatformFields from '../CommonPlatformFields';
import { ListInput } from 'components/shared/inputs/inputs';
import { formMetadata, metadata } from 'components/shared/inputs';
import { $t } from 'services/i18n';
import { FacebookService } from 'services/platforms/facebook';
import { IStreamSettings, StreamingService } from '../../../../services/streaming';
import { SyncWithValue } from '../../../../services/app/app-decorators';
import BaseEditSteamInfo from './BaseEditSteamInfo';

class Props {
  value?: IStreamSettings = undefined;
}

/**
 * Edit Facebook stream settings
 */
@Component({ props: createProps(Props) })
export default class FacebookEditStreamInfo extends BaseEditSteamInfo<Props> {
  @Inject() private facebookService: FacebookService;
  @Inject() private streamingService: StreamingService;
  @SyncWithValue() settings: IStreamSettings;

  get view() {
    return this.streamingService.views;
  }

  private get formMetadata() {
    return formMetadata({
      page: metadata.list({
        title: $t('Facebook Page'),
        fullWidth: true,
        options: this.facebookService.state.facebookPages?.options || [],
        required: true,
      }),
    });
  }

  render() {
    return (
      <ValidatedForm name="facebook-settings">
        <HFormGroup title={this.formMetadata.page.title}>
          <ListInput
            vModel={this.settings.platforms.facebook.facebookPageId}
            metadata={this.formMetadata.page}
          />
        </HFormGroup>

        {!this.canShowOnlyRequiredFields && (
          <CommonPlatformFields vModel={this.settings} platform={'facebook'} />
        )}
      </ValidatedForm>
    );
  }
}
