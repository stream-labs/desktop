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

class TwitchEditStreamProps {
  showOnlyRequiredFields? = false;
  value: ITwitchStartStreamOptions = {
    title: '',
    game: '',
    tags: [],
  };
}

@Component({ components: { TwitchTagsInput }, props: createProps(TwitchEditStreamProps) })
export default class TwitchEditStreamInfo extends TsxComponent<TwitchEditStreamProps> {
  @Inject() private twitchService: TwitchService;
  channelInfo: ITwitchStartStreamOptions = null;

  created() {
    this.channelInfo = {
      title: '',
      game: '',
      tags: [],
    };
  }

  @Watch('value')
  syncValue(val: TwitchEditStreamProps) {
    this.channelInfo = cloneDeep(val.value);
  }

  emitInput() {
    this.$emit('input', this.channelInfo);
  }

  private onGameInputHandler() {}

  searchingGames = false;
  private gameOptions: IListOption<string>[] = [];
  private gameMetadata = metadata.list({
    title: $t('Game'),
    placeholder: $t('Start typing to search'),
    options: this.gameOptions,
    loading: this.searchingGames,
    internalSearch: false,
    allowEmpty: true,
    noResult: $t('No matching game(s) found.'),
    required: true,
  });

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

  render(createElement: Function) {
    return (
      <ValidatedForm onInput={this.emitInput}>
        {!this.props.showOnlyRequiredFields &&
          createElement(TwitchTagsInput, {
            props: {
              value: this.channelInfo.tags,
              tags: this.channelInfo,
              availableTags: [],
              hasPermission: true,
            },
          })}
        <HFormGroup title={this.gameMetadata.title}>
          <ListInput
            onSearchChange={val => console.log('search change', val)}
            // onInput={this.onGameInput}
            vModel={this.channelInfo.game}
            metadata={this.gameMetadata}
          />
        </HFormGroup>
        {!this.props.showOnlyRequiredFields && (
          <StreamTitleAndDescription vModel={this.channelInfo} allowCustom={true} />
        )}
      </ValidatedForm>
    );
  }
}
