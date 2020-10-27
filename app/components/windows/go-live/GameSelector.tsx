import { Component } from 'vue-property-decorator';
import { IListOption, metadata } from 'components/shared/inputs';
import { ListInput, TagsInput } from 'components/shared/inputs/inputs';
import { getPlatformService, IPlatformCapabilityGame, TPlatform } from 'services/platforms';
import { $t } from 'services/i18n';
import { Debounce } from 'lodash-decorators';
import TsxComponent, { createProps } from '../../tsx-component';
import { SyncWithValue } from 'services/app/app-decorators';
import { IStreamSettings, StreamingService } from 'services/streaming';
import { Inject } from 'services/core';
import { TwitchService } from 'services/platforms/twitch';

class Props {
  value?: IStreamSettings;
  platform?: TPlatform | null = null;
}

/**
 * Selects a game for streaming
 */
@Component({ props: createProps(Props) })
export default class GameSelector extends TsxComponent<Props> {
  @Inject() private streamingService: StreamingService;
  @Inject() private twitchService: TwitchService;
  @SyncWithValue() private settings: IStreamSettings;

  private searchingGames = false;
  private games: IListOption<string, { image: string }>[] = [];

  $refs: {
    tagsInput: TagsInput;
  };

  private get selectedGameName(): string {
    return this.settings.platforms[this.props.platform]['game'];
  }

  private set selectedGameName(name: string) {
    this.$set(this.settings.platforms[this.props.platform], 'game', name);
  }

  get imageSize() {
    return this.supportImages && this.twitchService.gameImageSize;
  }

  get gameOptions() {
    const selectedGame = this.selectedGameName;
    if (selectedGame) return [{ value: selectedGame, title: selectedGame }, ...this.games];
    return this.games;
  }

  private get supportImages() {
    return this.props.platform === 'twitch';
  }

  created() {
    if (this.selectedGameName && this.supportImages) this.loadImageForSelectedGame();
  }

  private async loadImageForSelectedGame() {
    const selectedGameName = this.selectedGameName;
    const game = await this.twitchService.fetchGame(this.selectedGameName);
    if (!game || selectedGameName !== this.selectedGameName) return;
    const optionInd = this.games.findIndex(opt => opt.value === selectedGameName);
    this.games.splice(optionInd, 1, {
      value: selectedGameName,
      title: selectedGameName,
      data: { image: game.image },
    });
  }

  private onGameSearchHandler(searchString: string) {
    if (searchString.length > 1) {
      this.searchingGames = true;
      this.searchGames(searchString);
    }
  }

  @Debounce(500)
  private async searchGames(searchStr: string) {
    // search games for the target platform
    const selectedGame = this.selectedGameName;
    const games = await getPlatformService(this.props.platform).searchGames(searchStr);
    this.games = games.map(g => ({ value: g.name, title: g.name, data: { image: g.image } }));
    this.searchingGames = false;
  }

  private get gameMetadata() {
    return metadata.list({
      title: $t('Game'),
      name: 'game',
      placeholder: $t('Start typing to search'),
      // we should filter game list for the case when we disabled one of platform but still store search results for it
      options: this.gameOptions,
      loading: this.searchingGames,
      internalSearch: false,
      allowEmpty: true,
      noResult: $t('No matching game(s) found.'),
      required: true,
      fullWidth: true,
    });
  }

  render() {
    // use TagsInput for a multiplatform mode and ListInput for a single platform mode
    return (
      <ListInput
        handleSearchChange={searchStr => this.onGameSearchHandler(searchStr)}
        imageSize={this.imageSize}
        vModel={this.selectedGameName}
        metadata={this.gameMetadata}
      />
    );
  }
}
