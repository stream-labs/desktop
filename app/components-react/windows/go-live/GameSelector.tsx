// import { Component } from 'vue-property-decorator';
// import { IListOption, metadata } from 'components/shared/inputs';
// import { ListInput, TagsInput } from 'components/shared/inputs/inputs';
// import { getPlatformService, IPlatformCapabilityGame, TPlatform } from 'services/platforms';
// import { $t } from 'services/i18n';
// import { Debounce } from 'lodash-decorators';
// import TsxComponent, { createProps } from '../../tsx-component';
// import { SyncWithValue } from 'services/app/app-decorators';
// import { IGoLiveSettings, IStreamSettings, StreamingService } from 'services/streaming';
// import { Inject } from 'services/core';
// import { TwitchService } from 'services/platforms/twitch';

import React, { useState } from 'react';
import { IGoLiveSettings } from '../../../services/streaming';
import { getPlatformService, TPlatform } from '../../../services/platforms';
import { ListInput, TSlobsInputProps } from '../../shared/inputs';
import { $t } from '../../../services/i18n';
import { useOnCreate, useAsyncState, useStateActions, useDebounce } from '../../hooks';
import { Services } from '../../service-provider';
import { debounce } from 'lodash';
import { IListOption } from '../../shared/inputs/ListInput';
import { TSetPlatformSettingsFn } from './go-live';

type TState = {
  games: IListOption[];
  loading: boolean;
};

type TProps = TSlobsInputProps<{ platform: TPlatform }, string>;

export default function GameSelector(p: TProps) {
  const { platform } = p;
  const { TwitchService, FacebookService } = Services;
  const selectedGame =
    platform === 'twitch' ? TwitchService.state.settings.game : FacebookService.state.settings.game;

  const { s, updateState } = useStateActions<TState>(() => {
    return {
      games: selectedGame ? [{ label: selectedGame, value: selectedGame }] : ([] as IListOption[]),
      loading: false,
    };
  });

  useOnCreate(() => {
    loadImageForSelectedGame();
  });

  const searchGames = useDebounce(500, async (searchStr: string) => {
    const games = (platform === 'twitch'
      ? await TwitchService.searchGames(searchStr)
      : await FacebookService.searchGames(searchStr)
    ).map(g => ({ value: g.name, label: g.name, image: g.image }));
    updateState({ games });
  });

  async function loadImageForSelectedGame() {
    if (!selectedGame) return;
    const game = await TwitchService.fetchGame(selectedGame);
    if (!game || game.name !== selectedGame) return;
    updateState({
      games: s.games.map(opt => (opt.value === selectedGame ? { ...opt, image: game.image } : opt)),
      loading: false,
    });
  }

  function onSearch(searchString: string) {
    if (searchString.length < 2) return;
    updateState({ loading: true });
    searchGames(searchString);
  }

  const isTwitch = platform === 'twitch';

  return (
    <ListInput
      label={platform === 'twitch' ? $t('Twitch Game') : $t('Facebook Game')}
      name={`${p.platform}Game`}
      value={selectedGame}
      extra={p.extra}
      onChange={p.onChange}
      placeholder={$t('Start typing to search')}
      options={s.games}
      loading={s.loading}
      showSearch
      onSearch={onSearch}
      required={isTwitch}
      hasImage={isTwitch}
      imageSize={TwitchService.gameImageSize}
      notFoundContent={$t('No matching game(s) found.')}
    />
  );
}

//
// class Props {
//   value?: IStreamSettings = null;
//   platform?: TPlatform | null = null;
//   settings: IGoLiveSettings = null;
//   onInput: (name: string) => unknown = () => null;
// }
//
// /**
//  * Selects a game for streaming
//  */
// @Component({ props: createProps(Props) })
// export default class GameSelector extends TsxComponent<Props> {
//   @Inject() private streamingService: StreamingService;
//   @Inject() private twitchService: TwitchService;
//
//   private searchingGames = false;
//   private games: IListOption<string, { image: string }>[] = [];
//
//   $refs: {
//     tagsInput: TagsInput;
//   };
//
//   private get selectedGameName(): string {
//     return this.props.settings.platforms[this.props.platform]['game'];
//   }
//
//   private set selectedGameName(name: string) {
//     this.props.onInput(name);
//   }
//
//   get imageSize() {
//     return this.supportImages && this.twitchService.gameImageSize;
//   }
//
//   get gameOptions() {
//     const selectedGame = this.selectedGameName;
//     if (selectedGame) return [{ value: selectedGame, title: selectedGame }, ...this.games];
//     return this.games;
//   }
//
//   private get supportImages() {
//     return this.props.platform === 'twitch';
//   }
//
//   created() {
//     if (this.selectedGameName && this.supportImages) this.loadImageForSelectedGame();
//   }
//
//   private async loadImageForSelectedGame() {
//     const selectedGameName = this.selectedGameName;
//     const game = await this.twitchService.fetchGame(this.selectedGameName);
//     if (!game || selectedGameName !== this.selectedGameName) return;
//     const optionInd = this.games.findIndex(opt => opt.value === selectedGameName);
//     this.games.splice(optionInd, 1, {
//       value: selectedGameName,
//       title: selectedGameName,
//       data: { image: game.image },
//     });
//   }
//
//   private onGameSearchHandler(searchString: string) {
//     if (searchString.length > 1) {
//       this.searchingGames = true;
//       this.searchGames(searchString);
//     }
//   }
//
//   @Debounce(500)
//   private async searchGames(searchStr: string) {
//     // search games for the target platform
//     const selectedGame = this.selectedGameName;
//     const games = await getPlatformService(this.props.platform).searchGames(searchStr);
//     this.games = games.map(g => ({ value: g.name, title: g.name, data: { image: g.image } }));
//     this.searchingGames = false;
//   }
//
//   private get gameMetadata() {
//     return metadata.list({
//                            title: $t('Game'),
//                            name: `${this.props.platform}Game`,
//                            placeholder: $t('Start typing to search'),
//                            // we should filter game list for the case when we disabled one of platform but still store search results for it
//                            options: this.gameOptions,
//                            loading: this.searchingGames,
//                            internalSearch: false,
//                            allowEmpty: true,
//                            noResult: $t('No matching game(s) found.'),
//                            required: true,
//                            fullWidth: true,
//                          });
//   }
//
//   render() {
//     // use TagsInput for a multiplatform mode and ListInput for a single platform mode
//     return (
//       <div>
//         {this.selectedGameName}
//         <ListInput
//           handleSearchChange={searchStr => this.onGameSearchHandler(searchStr)}
//           imageSize={this.imageSize}
//           vModel={this.selectedGameName}
//           metadata={this.gameMetadata}
//         />
//       </div>
//     );
//   }
// }
