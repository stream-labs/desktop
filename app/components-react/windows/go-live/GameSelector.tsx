import React, { useEffect, useState } from 'react';
import { TPlatform } from '../../../services/platforms';
import { ListInput, TSlobsInputProps } from '../../shared/inputs';
import { $t } from '../../../services/i18n';
import { useOnCreate, useFormState } from '../../hooks';
import { Services } from '../../service-provider';
import { IListOption } from '../../shared/inputs/ListInput';

type TProps = TSlobsInputProps<{ platform: TPlatform }, string>;

export default function GameSelector(p: TProps) {
  const { platform } = p;
  const { TwitchService, FacebookService } = Services;
  const selectedGame: string =
    (platform === 'twitch'
      ? TwitchService.state.settings.game
      : FacebookService.state.settings.game) || '';

  const { s, updateState } = useFormState(() => {
    return {
      games: selectedGame
        ? [{ label: selectedGame, value: selectedGame }]
        : ([] as IListOption<string>[]),
    };
  });

  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadImageForSelectedGame();
  }, []);

  async function loadImageForSelectedGame() {
    if (platform !== 'twitch') return;
    if (!selectedGame) return;
    const game = await TwitchService.actions.return.fetchGame(selectedGame);
    if (!game || game.name !== selectedGame) return;
    updateState({
      games: s.games.map(opt => (opt.value === selectedGame ? { ...opt, image: game.image } : opt)),
    });
  }

  async function onSearch(searchString: string) {
    if (searchString.length < 2) return;
    const games = (platform === 'twitch'
      ? await TwitchService.actions.return.searchGames(searchString)
      : await FacebookService.actions.return.searchGames(searchString)
    ).map(g => ({ value: g.name, label: g.name, image: g.image }));
    updateState({ games });
    setIsSearching(false);
  }

  function onBeforeSearchHandler(searchString: string) {
    if (searchString.length < 2) return;
    setIsSearching(true);
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
      onBeforeSearch={onBeforeSearchHandler}
      imageSize={TwitchService.gameImageSize}
      loading={isSearching}
      notFoundContent={isSearching ? $t('Searching...') : $t('No matching game(s) found.')}
      allowClear
    />
  );
}
