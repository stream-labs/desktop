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
import { useOnCreate, useAsyncState, useStateHelper, useDebounce } from '../../hooks';
import { Services } from '../../service-provider';
import { debounce } from 'lodash';
import { IListOption } from '../../shared/inputs/ListInput';
import { TSetPlatformSettingsFn } from './go-live';

type TState = {
  games: IListOption[];
};

type TProps = TSlobsInputProps<{ platform: TPlatform }, string>;

export default function GameSelector(p: TProps) {
  const { platform } = p;
  const { TwitchService, FacebookService } = Services;
  const selectedGame: string =
    (platform === 'twitch'
      ? TwitchService.state.settings.game
      : FacebookService.state.settings.game) || '';

  const { s, updateState } = useStateHelper(() => {
    return {
      games: selectedGame ? [{ label: selectedGame, value: selectedGame }] : ([] as IListOption[]),
    };
  });

  useOnCreate(() => {
    loadImageForSelectedGame();
  });

  async function loadImageForSelectedGame() {
    if (!selectedGame) return;
    const game = await TwitchService.fetchGame(selectedGame);
    if (!game || game.name !== selectedGame) return;
    updateState({
      games: s.games.map(opt => (opt.value === selectedGame ? { ...opt, image: game.image } : opt)),
    });
  }

  async function onSearch(searchString: string) {
    if (searchString.length < 2) return;
    const games = (platform === 'twitch'
      ? await TwitchService.searchGames(searchString)
      : await FacebookService.searchGames(searchString)
    ).map(g => ({ value: g.name, label: g.name, image: g.image }));
    updateState({ games });
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
      showSearch
      onSearch={onSearch}
      debounce={500}
      required={isTwitch}
      hasImage={isTwitch}
      imageSize={TwitchService.gameImageSize}
      notFoundContent={$t('No matching game(s) found.')}
    />
  );
}
