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

class Props {
  showOnlyRequiredFields? = false;
}

@Component({ props: createProps(Props) })
export default class FacebookEditStreamInfo extends TsxComponent<Props> {
  @Inject() private facebookService: FacebookService;
  channelInfo: IFacebookStartStreamOptions = null;

  async created() {
    this.channelInfo = {
      facebookPageId: '',
      title: '',
      game: '',
      description: '',
    };
  }

  private formMetadata = formMetadata({
    page: metadata.list({
      title: $t('Facebook Page'),
      fullWidth: true,
      options: [], /// this.facebookService.state.facebookPages.options,
      required: true,
    }),
    game: metadata.text({
      title: $t('Game'),
      fullWidth: true,
    }),
  });

  render() {
    const showOnlyRequiredFields = this.props.showOnlyRequiredFields;
    return (
      <ValidatedForm>
        <HFormGroup title={this.formMetadata.page.title}>
          <ListInput
            onSearchChange={val => console.log('search change', val)}
            // onInput={this.onGameInput}
            vModel={this.channelInfo.facebookPageId}
            metadata={this.formMetadata.page}
          />
        </HFormGroup>

        {!showOnlyRequiredFields && (
          <HFormGroup metadata={this.formMetadata.game} vModel={this.channelInfo.game} />
        )}

        {!showOnlyRequiredFields && (
          <StreamTitleAndDescription vModel={this.channelInfo} allowCustom={true} />
        )}
      </ValidatedForm>
    );
  }
}
