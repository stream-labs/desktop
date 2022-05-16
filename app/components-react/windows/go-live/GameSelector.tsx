import React, { useEffect } from 'react';
import {
  getPlatformService,
  IGame,
  IPlatformCapabilityGame,
  TPlatform,
} from '../../../services/platforms';
import { ListInput, TSlobsInputProps } from '../../shared/inputs';
import { $t } from '../../../services/i18n';
import { IListOption } from '../../shared/inputs/ListInput';
import { Services } from '../../service-provider';
import { injectState, useModule } from 'slap';

type TProps = TSlobsInputProps<{ platform: TPlatform }, string>;

export default function GameSelector(p: TProps) {
  const { platform } = p;
  const platformService = (getPlatformService(platform) as unknown) as IPlatformCapabilityGame;
  const selectedGameId = platformService.state.settings.game;
  let selectedGameName = selectedGameId;

  if (platform === 'trovo') {
    selectedGameName = Services.TrovoService.state.channelInfo.gameName;
  }

  const { isSearching, setIsSearching, games, setGames } = useModule(() => ({
    state: injectState({
      isSearching: false,
      games: selectedGameId
        ? [{ label: selectedGameName, value: selectedGameId }]
        : ([] as IListOption<string>[]),
    }),
  }));

  function fetchGames(query: string): Promise<IGame[]> {
    return platformService.searchGames(query);
  }

  useEffect(() => {
    loadImageForSelectedGame();
  }, []);

  async function loadImageForSelectedGame() {
    // game images available for Twitch and Trovo only
    if (!['twitch', 'trovo'].includes(platform)) return;
    if (!selectedGameName) return;
    const game = await platformService.fetchGame(selectedGameName);
    if (!game || game.name !== selectedGameName) return;
    setGames(games.map(opt =>
      opt.value === selectedGameId ? { ...opt, image: game.image } : opt,
    ));
  }

  async function onSearch(searchString: string) {
    if (searchString.length < 2) return;
    const games = (await fetchGames(searchString)).map(g => ({
      value: platform === 'trovo' ? g.id : g.name,
      label: g.name,
      image: g.image,
    }));
    setGames(games);
    setIsSearching(false);
  }

  function onBeforeSearchHandler(searchString: string) {
    if (searchString.length < 2) return;
    setIsSearching(true);
  }

  const isTwitch = platform === 'twitch';
  const isTrovo = platform === 'trovo';

  const label = {
    twitch: $t('Twitch Category'),
    facebook: $t('Facebook Game'),
    trovo: $t('Trovo Category'),
  }[platform as string];

  return (
    <ListInput
      label={label}
      name={`${p.platform}Game`}
      value={selectedGameId}
      extra={p.extra}
      onChange={p.onChange}
      placeholder={$t('Start typing to search')}
      options={games}
      showSearch
      onSearch={onSearch}
      debounce={500}
      required={isTwitch || isTrovo}
      hasImage={isTwitch || isTrovo}
      onBeforeSearch={onBeforeSearchHandler}
      imageSize={platformService.gameImageSize}
      loading={isSearching}
      notFoundContent={isSearching ? $t('Searching...') : $t('No matching game(s) found.')}
      allowClear
    />
  );
}
