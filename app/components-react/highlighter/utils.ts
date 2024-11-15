import moment from 'moment';
import { IAiClip, TClip } from 'services/highlighter';
import { useRef, useEffect, useCallback } from 'react';
import { EHighlighterInputTypes } from 'services/highlighter/ai-highlighter/ai-highlighter';
import styles from './ClipsView.m.less';
export const isAiClip = (clip: TClip): clip is IAiClip => clip.source === 'AiClip';

export function groupStreamsByTimePeriod(streams: { id: string; date: string }[]) {
  const now = moment();
  const groups: { [key: string]: typeof streams } = {
    Today: [],
    Yesterday: [],
    'This week': [],
    'Last week': [],
    'This month': [],
    'Last month': [],
  };
  const monthGroups: { [key: string]: typeof streams } = {};

  streams.forEach(stream => {
    const streamDate = moment(stream.date);
    if (streamDate.isSame(now, 'day')) {
      groups['Today'].push(stream);
    } else if (streamDate.isSame(now.clone().subtract(1, 'day'), 'day')) {
      groups['Yesterday'].push(stream);
    } else if (streamDate.isSame(now, 'week')) {
      groups['This week'].push(stream);
    } else if (streamDate.isSame(now.clone().subtract(1, 'week'), 'week')) {
      groups['Last week'].push(stream);
    } else if (streamDate.isSame(now, 'month')) {
      groups['This month'].push(stream);
    } else if (streamDate.isSame(now.clone().subtract(1, 'month'), 'month')) {
      groups['Last month'].push(stream);
    } else {
      const monthKey = streamDate.format('MMMM YYYY');
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = [];
      }
      monthGroups[monthKey].push(stream);
    }
  });

  return { ...groups, ...monthGroups };
}

export function sortClips(clips: TClip[], streamId: string | undefined): TClip[] {
  let sortedClips;

  if (streamId) {
    const clipsWithOrder = clips
      .filter(c => c.streamInfo?.[streamId]?.orderPosition !== undefined && c.deleted !== true)
      .sort(
        (a: TClip, b: TClip) =>
          a.streamInfo![streamId]!.orderPosition - b.streamInfo![streamId]!.orderPosition,
      );

    const clipsWithOutOrder = clips.filter(
      c =>
        (c.streamInfo === undefined ||
          c.streamInfo[streamId] === undefined ||
          c.streamInfo[streamId]?.orderPosition === undefined) &&
        c.deleted !== true,
    );

    sortedClips = [...clipsWithOrder, ...clipsWithOutOrder];
  } else {
    sortedClips = clips
      .filter(c => c.deleted !== true)
      .sort((a: TClip, b: TClip) => a.globalOrderPosition - b.globalOrderPosition);
  }

  return sortedClips;
}

export function clipsToStringArray(clips: TClip[]): { id: string }[] {
  return clips.map(c => ({ id: c.path }));
}

export function createFinalSortedArray(
  newOrderOfSomeItems: string[],
  allItemArray: string[],
): string[] {
  const finalArray: (string | null)[] = new Array(allItemArray.length).fill(null);
  const itemsNotInNewOrder = allItemArray.filter(item => !newOrderOfSomeItems.includes(item));

  itemsNotInNewOrder.forEach(item => {
    const index = allItemArray.indexOf(item);
    finalArray[index] = item;
  });

  let newOrderIndex = 0;
  for (let i = 0; i < finalArray.length; i++) {
    if (finalArray[i] === null) {
      finalArray[i] = newOrderOfSomeItems[newOrderIndex];
      newOrderIndex++;
    }
  }

  return finalArray.filter((item): item is string => item !== null);
}

export function filterClips(clips: TClip[], filter: string) {
  return clips.filter(clip => {
    switch (filter) {
      case 'ai':
        return clip.source === 'AiClip';
      case 'manual':
        return clip.source === 'Manual' || clip.source === 'ReplayBuffer';
      case 'all':
      default:
        return true;
    }
  });
}
export function sortAndFilterClips(clips: TClip[], streamId: string | undefined, filter: string) {
  const sortedClips = sortClips(clips, streamId);
  const filteredClips = filterClips(sortedClips, filter);
  const sorted = sortedClips.map(clip => ({ id: clip.path }));
  const sortedFiltered = filteredClips.map(clip => ({
    id: clip.path,
  }));

  return { sorted, sortedFiltered };
}

export const useOptimizedHover = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastHoveredId = useRef<string | null>(null);

  const handleHover = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const clipElement = target.closest('[data-clip-id]');
    const clipId = clipElement?.getAttribute('data-clip-id');

    if (clipId === lastHoveredId.current) return; // Exit if hovering over the same element

    if (lastHoveredId.current) {
      // Remove highlight from previously hovered elements
      document
        .querySelectorAll(`[data-clip-id="${lastHoveredId.current}"]`)
        .forEach(el => el instanceof HTMLElement && el.classList.remove(styles.highlighted));
    }

    if (clipId) {
      // Add highlight to newly hovered elements
      document
        .querySelectorAll(`[data-clip-id="${clipId}"]`)
        .forEach(el => el instanceof HTMLElement && el.classList.add(styles.highlighted));
      lastHoveredId.current = clipId;
    } else {
      lastHoveredId.current = null;
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleHover, { passive: true });
      container.addEventListener('mouseleave', handleHover, { passive: true });

      return () => {
        container.removeEventListener('mousemove', handleHover);
        container.removeEventListener('mouseleave', handleHover);
      };
    }
  }, [handleHover]);

  return containerRef;
};

export interface IFilterOptions {
  rounds: number[];
  targetDuration: number;
  includeAllEvents: boolean;
}

export function aiFilterClips(
  clips: TClip[],
  streamId: string | undefined,
  options: IFilterOptions,
): TClip[] {
  const { rounds, targetDuration, includeAllEvents } = options;

  const selectedRounds =
    rounds.length === 1 && rounds[0] === 0
      ? [
          ...new Set(
            clips
              .filter(clip => clip.source === 'AiClip')
              .map(clip => (clip as IAiClip).aiInfo.metadata?.round),
          ),
        ]
      : rounds;

  // console.log('selectedRounds', selectedRounds);

  // Sort rounds by score (descending)
  const sortedRounds = selectedRounds.sort(
    (a, b) => getRoundScore(b, clips) - getRoundScore(a, clips),
  );

  // console.log('sortedRounds by rooundScore', sortedRounds);

  let clipsFromRounds: TClip[] = [];

  let totalDuration = 0;
  for (var i = 0; i < sortedRounds.length; ++i) {
    if (totalDuration > targetDuration) {
      // console.log(`Duration: ${totalDuration} more than target: ${targetDuration}`);
      break;
    } else {
      // console.log(`Duration: ${totalDuration} less than target: ${targetDuration}`);
      //Todo M: how do sort? Per round or all together and then the rounds are in the stream order again?
      const roundIndex = sortedRounds[i];
      // console.log('include round ', roundIndex);

      const roundClips = sortClips(getClipsOfRound(roundIndex, clips), streamId);
      // console.log(
      //   'roundClips before adding:',
      //   roundClips.map(c => ({
      //     duration: c.duration,
      //   })),
      // );

      clipsFromRounds = [...clipsFromRounds, ...roundClips];

      // console.log(
      //   'clipsFromRounds after adding:',
      //   clipsFromRounds.map(c => ({
      //     duration: c.duration,
      //   })),
      // );
      totalDuration = getCombinedClipsDuration(clipsFromRounds);
      // console.log('new totalDuration:', totalDuration);
    }
    // console.log('clipsFromRounds', clipsFromRounds);
  }
  const contextTypes = [
    EHighlighterInputTypes.DEPLOY,
    EHighlighterInputTypes.DEATH,
    EHighlighterInputTypes.VICTORY,
  ];
  const clipsSortedByScore = clipsFromRounds
    .filter(
      clips => !(clips as IAiClip).aiInfo.inputs.some(input => contextTypes.includes(input.type)),
    )
    .sort((a, b) => (a as IAiClip).aiInfo.score - (b as IAiClip).aiInfo.score);
  // console.log(
  //   'clipsSortedByScore',
  //   clipsSortedByScore.map(clip => {
  //     return {
  //       score: (clip as IAiClip).aiInfo.score,
  //       inputs: JSON.stringify((clip as IAiClip).aiInfo.inputs),
  //     };
  //   }),
  // );
  // console.log('clipsFromRounds', clipsFromRounds);

  let filteredClips: TClip[] = clipsFromRounds;
  let currentDuration = getCombinedClipsDuration(filteredClips);

  // console.log('remove clipswise to get closer to target');

  const BUFFER_SEC = 0;
  while (currentDuration > targetDuration + BUFFER_SEC) {
    // console.log('ruuun currentDuration', currentDuration);
    if (clipsSortedByScore === undefined || clipsSortedByScore.length === 0) {
      break;
    }

    const clipToRemove = clipsSortedByScore[0];
    clipsSortedByScore.splice(0, 1); // remove from our sorted array

    const index = filteredClips.findIndex(clip => clip.path === clipToRemove.path);

    if (index > -1) {
      filteredClips.splice(index, 1); // 2nd parameter means remove one item only
      currentDuration = getCombinedClipsDuration(filteredClips);
      // console.log(
      //   'removed, new currentDuration:',
      //   currentDuration,
      //   'target:',
      //   targetDuration + BUFFER_SEC,
      // );
    }
  }

  return filteredClips;
}

export function getCombinedClipsDuration(clips: TClip[]): number {
  return clips.reduce((sum, clip) => sum + (clip.duration || 0), 0);
}

function getClipsOfRound(round: number, clips: TClip[]): TClip[] {
  return clips.filter(
    clip => clip.source === 'AiClip' && (clip as IAiClip).aiInfo.metadata.round === round,
  );
}

function getRoundScore(round: number, clips: TClip[]): number {
  return getClipsOfRound(round, clips).reduce(
    (sum, clip) => sum + ((clip as IAiClip).aiInfo?.score || 0),
    0,
  );
}
