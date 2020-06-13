import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { cloneDeep } from 'lodash';
import TsxComponent, { createProps } from 'components/tsx-component';

import StreamTitleAndDescription from './StreamTitleAndDescription';
import { ITwitchStartStreamOptions, TwitchService } from '../../services/platforms/twitch';
import { TTwitchTag } from '../../services/platforms/twitch/tags';
import TwitchTagsInput from '../shared/inputs/TwitchTagsInput.vue';
import { ListInput } from '../shared/inputs/inputs';
import { IListOption, metadata } from '../shared/inputs';
import { $t } from '../../services/i18n';
import { getPlatformService } from '../../services/platforms';
import { Debounce } from 'lodash-decorators/debounce';
import { IGoLiveSettings } from '../../services/streaming';

class TwitchEditStreamProps {
  showOnlyRequiredFields? = false;
  value?: IGoLiveSettings['destinations']['twitch'] = {
    title: '',
    game: '',
    tags: [],
    enabled: true,
    useCustomTitleAndDescription: false,
  };
}

@Component({ components: { TwitchTagsInput }, props: createProps(TwitchEditStreamProps) })
export default class TwitchEditStreamInfo extends TsxComponent<TwitchEditStreamProps> {
  @Inject() private twitchService: TwitchService;
  settings: IGoLiveSettings['destinations']['twitch'] = null;

  created() {
    this.syncValue(this.value);
  }

  @Watch('value')
  syncValue(val: IGoLiveSettings['destinations']['twitch']) {
    this.settings = cloneDeep(val);
  }

  emitInput() {
    this.$emit('input', this.settings);
  }

  searchingGames = false;
  private gameOptions: IListOption<string>[] = [];
  private get gameMetadata() {
    return metadata.list({
      title: $t('Game'),
      placeholder: $t('Start typing to search'),
      options: this.gameOptions,
      loading: this.searchingGames,
      internalSearch: false,
      allowEmpty: true,
      noResult: $t('No matching game(s) found.'),
      required: true,
    });
  }

  @Debounce(500)
  async onGameSearchHandler(searchString: string) {
    if (searchString !== '') {
      this.searchingGames = true;
      const service = getPlatformService('twitch');

      this.gameOptions = [];

      return service.searchGames(searchString).then(games => {
        this.searchingGames = false;
        if (games && games.length) {
          games.forEach(game => {
            this.gameOptions.push({
              title: game.name,
              value: game.name,
            });
          });
        }
      });
    }
  }

  private render() {
    return (
      <ValidatedForm onInput={this.emitInput}>
        {!this.props.showOnlyRequiredFields && (
          <TwitchTagsInput
            tags={this.twitchService.state.availableTags}
            hasPermission={this.twitchService.state.hasUpdateTagsPermission}
            vModel={this.settings.tags}
          />
        )}
        <HFormGroup title={this.gameMetadata.title}>
          <ListInput
            handleSearchChange={val => this.onGameSearchHandler(val)}
            vModel={this.settings.game}
            metadata={this.gameMetadata}
          />
        </HFormGroup>
        {!this.props.showOnlyRequiredFields && (
          <StreamTitleAndDescription vModel={this.settings} allowCustom={true} />
        )}
      </ValidatedForm>
    );
  }
}
