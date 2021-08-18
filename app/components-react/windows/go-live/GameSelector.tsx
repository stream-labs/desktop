import React, { useEffect, useState } from 'react';
import { IGame, TPlatform } from '../../../services/platforms';
import { ListInput, TSlobsInputProps } from '../../shared/inputs';
import { $t } from '../../../services/i18n';
import { useFormState } from '../../hooks';
import { Services } from '../../service-provider';
import { IListOption } from '../../shared/inputs/ListInput';

type TProps = TSlobsInputProps<{ platform: TPlatform }, string>;

export default function GameSelector(p: TProps) {
  const { platform, value } = p;
  const selectedGame = value;
  const { TwitchService, FacebookService } = Services;

  const { s, updateState } = useFormState(() => {
    if (!selectedGame) {
      return {
        games: [] as IListOption<string>[],
      };
    }
    const value = selectedGame;
    const label =
      platform === 'twitch' ? TwitchService.state.settings.gameName || '' : selectedGame;
    return {
      games: [{ label, value }],
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
    if (!game || game.id !== selectedGame) return;
    updateState({
      games: s.games.map(opt => (opt.value === selectedGame ? { ...opt, image: game.image } : opt)),
    });
  }

  async function onSearch(searchString: string) {
    if (searchString.length < 2) return;

    const games =
      platform === 'twitch'
        ? (await TwitchService.actions.return.searchGames(searchString)).map(getGameOption)
        : (await FacebookService.actions.return.searchGames(searchString)).map(getGameOption);
    updateState({ games });
    setIsSearching(false);
  }

  function getGameOption(game: IGame): IListOption<string> {
    return platform === 'twitch'
      ? {
          value: game.id,
          label: game.name,
          image: game.image,
        }
      : {
          value: game.name,
          label: game.name,
          image: game.image,
        };
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
