import { Component, Prop, Watch } from 'vue-property-decorator';
import cx from 'classnames';
import { IListMetadata, IListOption, metadata } from 'components/shared/inputs';
import { ListInput, TagsInput } from 'components/shared/inputs/inputs';
import { getPlatformService, IGame, TPlatform } from '../../../services/platforms';
import { $t } from 'services/i18n';
import { Debounce } from 'lodash-decorators';
import HFormGroup from '../../shared/inputs/HFormGroup.vue';
import TsxComponent, { createProps } from '../../tsx-component';
import { SyncWithValue } from '../../../services/app/app-decorators';
import { IStreamSettings, StreamingService } from 'services/streaming';
import { Inject } from '../../../services/core';
import { flatten, sortBy } from 'lodash';
import PlatformLogo from '../../shared/PlatformLogo';

interface IGameOptionData {
  platform: TPlatform;
  bgColor: string;
  game: string;
}

type TGameOption = IListOption<string, IGameOptionData>;

interface IItemSlotScope {
  option: IListOption<string, IGameOptionData>;
}

class Props {
  value?: IStreamSettings;
  platform?: TPlatform | null = null;
}

@Component({ props: createProps(Props) })
export default class GameSelector extends TsxComponent<Props> {
  @Inject() private streamingService: StreamingService;
  @SyncWithValue() private settings: IStreamSettings = null;

  private searchingGames = false;
  private gameOptions: TGameOption[] = [];
  private lastSelectedOption: TGameOption = null;

  $refs: {
    tagsInput: TagsInput;
  };

  get view() {
    return this.streamingService.views;
  }

  // created() {
  //   this.gameOptions = [...this.selectedOptions];
  //
  //   // this.gameOptions = this.settings.game
  //   //   ? [{ value: this.settings.game, title: this.settings.game }]
  //   //   : [];
  // }

  private createGameOption(
    platform: TPlatform,
    game: string,
  ): IListOption<string, IGameOptionData> {
    const bgColor = { twitch: '#6441a4', facebook: '#3b5998' }[platform];
    return {
      title: game,
      value: `${platform} ${game}`,
      data: { platform, bgColor, game },
    };
  }

  private get selectedOptions(): TGameOption[] {
    const options: TGameOption[] = [];
    this.targetPlatforms.forEach(platform => {
      const gameName = this.settings.destinations[platform]['game'];
      if (gameName) options.push(this.createGameOption(platform, gameName));
    });
    return options;
  }

  @Watch('selectedOptions', { immediate: true })
  addSelectedOptionsToList() {
    // add selected games to the options list
    this.selectedOptions.forEach(option => {
      if (!this.gameOptions.find(game => game.value === option.value)) {
        this.gameOptions.push(option);
      }
    });
  }

  /**
   * platforms that we need to search games in
   */
  private get targetPlatforms(): TPlatform[] {
    if (this.props.platform) return [this.props.platform];
    const destinations = Object.keys(this.settings.destinations) as TPlatform[];
    return destinations.filter((dest: TPlatform) => {
      const platformSettings = this.settings.destinations[dest];
      return (
        platformSettings.enabled &&
        (!this.settings.advancedMode || !platformSettings.useCustomFields) &&
        this.view.supports('game', [dest])
      );
    });
  }

  onGameSearchHandler(searchString: string) {
    if (searchString.length > 1) {
      this.searchingGames = true;
      this.searchGames(searchString);
    }
  }

  @Debounce(500)
  private async searchGames(searchStr: string) {
    const gameList = flatten(
      await Promise.all(
        this.targetPlatforms.map(platform => getPlatformService(platform).searchGames(searchStr)),
      ),
    );

    this.gameOptions = gameList
      .filter(game => game)
      .map(game => {
        const platform = game['_id'] ? 'twitch' : 'facebook';
        return this.createGameOption(platform, game.name);
      });

    this.gameOptions = sortBy(this.gameOptions, 'title');
    this.addSelectedOptionsToList();
    this.searchingGames = false;

    console.log('loaded', this.gameOptions);
  }

  private get gameMetadata() {
    return metadata.list<IGameOptionData>({
      title: $t('Game'),
      name: 'game',
      placeholder: $t('Start typing to search'),
      // we should filter game list for the case when we disabled one of platform but still store search results for it
      options: this.gameOptions.filter(game => this.targetPlatforms.includes(game.data.platform)),
      loading: this.searchingGames,
      internalSearch: false,
      allowEmpty: true,
      noResult: $t('No matching game(s) found.'),
      required: true,
      fullWidth: true,
      disabled: !this.targetPlatforms.length,
    });
  }

  private get gameSelectorValue() {
    return this.selectedOptions.map(option => option.value);
  }

  private onSelectHandler(option: TGameOption) {
    this.lastSelectedOption = option;
  }

  /**
   * sync game selector with the stream settings
   */
  private onInputHandler(values: string[]) {
    const options = values.map(value => this.gameOptions.find(opt => opt.value === value));
    const targetPlatforms = this.targetPlatforms;
    const isMultiplatformMode = targetPlatforms.length > 1;

    // don't allow to select more than one game for each platform
    if (this.lastSelectedOption) {
      const itemToRemoveInd = options.findIndex(
        opt =>
          this.lastSelectedOption.value !== opt.value &&
          opt.data.platform === this.lastSelectedOption.data.platform,
      );
      if (itemToRemoveInd !== -1) options.splice(itemToRemoveInd, 1);
      this.lastSelectedOption = null;
    }

    // update game for platforms
    targetPlatforms.forEach(platform => {
      const option = options.find(opt => opt?.data.platform === platform);
      if (option) {
        this.$set(this.settings.destinations[platform], 'game', option.data.game);
        return;
      }
      this.$set(this.settings.destinations[platform], 'game', '');
    });

    // close the game selector if max items has been selected
    if (isMultiplatformMode && options.length === targetPlatforms.length) {
      this.$refs.tagsInput.toggle();
    }
  }

  render() {
    return this.targetPlatforms.length > 1 ? (
      <TagsInput
        ref="tagsInput"
        handleOnSearch={val => this.onGameSearchHandler(val)}
        handleOnSelect={(val: TGameOption) => this.onSelectHandler(val)}
        value={this.gameSelectorValue}
        onInput={(values: string[]) => this.onInputHandler(values)}
        metadata={this.gameMetadata}
        scopedSlots={{ item: (props: IItemSlotScope) => this.renderItem(props) }}
      />
    ) : (
      <ListInput
        handleSearchChange={val => this.onGameSearchHandler(val)}
        value={this.gameSelectorValue[0]}
        onInput={(val: string) => this.onInputHandler([val])}
        metadata={this.gameMetadata}
      />
    );
  }

  private renderItem(props: IItemSlotScope) {
    if (!props.option.data) return;
    const title = props.option.title;
    const { platform } = props.option.data;
    return (
      <div>
        <PlatformLogo platform={platform} style={{ marginRight: '8px' }} /> {title}
      </div>
    );
  }
}
