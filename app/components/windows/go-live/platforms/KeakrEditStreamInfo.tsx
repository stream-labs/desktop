import { Component } from 'vue-property-decorator';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { createProps } from 'components/tsx-component';
import { ListInput, TextInput } from 'components/shared/inputs/inputs';
import { KeakrService } from 'services/platforms/keakr';
import { Inject } from 'services/core/injector';
import { formMetadata, IListOption, metadata } from 'components/shared/inputs';
import { $t } from 'services/i18n';
import { IStreamSettings, StreamingService } from 'services/streaming';
import { SyncWithValue } from 'services/app/app-decorators';
import BaseEditSteamInfo from './BaseEditSteamInfo';

class Props {
  value?: IStreamSettings = undefined;
}

/**
 * Edit Keakr stream settings
 */
@Component({ props: createProps(Props) })
export default class KeakrEditStreamInfo extends BaseEditSteamInfo<Props> {
  @Inject() private keakrService: KeakrService;
  @SyncWithValue() settings: IStreamSettings;

  async created() {
  }

  private get formMetadata() {
    const keakrSettings = this.keakrService.state
    let options = [{
      value: 'new',
      title: $t('Create a new live')
    }]
    keakrSettings.scheduledLives.forEach(live => options.push({
      value: live.id,
      title: live.title
    }))
    return formMetadata({
      destinationType: metadata.list({
        title: $t('Keakr destination'),
        fullWidth: true,
        options: options,
        required: true,
      }),
      title: metadata.text({
        title: $t('Live title'),
        fullWidth: true,
      })
    });
  }

  render() {
    return (
      <ValidatedForm name="keakr-settings">
        <div>
          <div style="margin-bottom: 10px">
            {$t('Select an live you scheduled on your keakr account in the dropdown below or to start a brand new livestream.')}
          </div>
          <hr />
          <HFormGroup title={this.formMetadata.destinationType.title}>
            <ListInput
              vModel={this.settings.platforms.keakr.keakId}
              metadata={this.formMetadata.destinationType}
            />
          </HFormGroup>
          {this.settings.platforms.keakr.keakId == 'new' && (
            <HFormGroup title={this.formMetadata.title.title}>
              <TextInput 
                vModel={this.settings.platforms.keakr.title}></TextInput>
            </HFormGroup>)}
        
        </div>
      </ValidatedForm>
    );
  }
}
