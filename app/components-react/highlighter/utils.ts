import moment from 'moment';
import { IAiClip, TClip } from 'services/highlighter';

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
