import { useStateManager } from '../../hooks/useStateManager';
import { IStreamEvent } from '../../../services/streaming';
import { IYoutubeLiveBroadcast } from '../../../services/platforms/youtube';
import { IFacebookLiveVideoExtended } from '../../../services/platforms/facebook';
import { Services } from '../../service-provider';

const initialState = {
  isLoading: false,
  events: [] as IStreamEvent[],
};

export function useStreamScheduler() {
  return useStateManager(
    initialState,
    (getState, setState) => {
      const { StreamingService, YoutubeService, FacebookService } = Services;
      const view = StreamingService.views;

      async function loadStreamEvents() {
        // load fb and yt events simultaneously
        setState({ isLoading: true, events: [] });
        await StreamingService.actions.return.prepopulateInfo();
        const events: IStreamEvent[] = [];
        const [fbEvents, ytEvents] = await Promise.all([loadFbEvents(), loadYTBEvents()]);

        // convert fb and yt events to the unified IStreamEvent format
        ytEvents.forEach(ytEvent => {
          events.push(convertYTBroadcastToEvent(ytEvent));
        });

        fbEvents.forEach(fbEvent => {
          events.push(convertFBLiveVideoToEvent(fbEvent));
        });
        setState({ isLoading: true, events });
      }

      async function loadYTBEvents() {
        if (!view.linkedPlatforms.includes('youtube')) return [];
        return await YoutubeService.actions.return.fetchBroadcasts();
      }

      async function loadFbEvents() {
        if (!view.linkedPlatforms.includes('facebook')) return [];
        return await FacebookService.actions.return.fetchAllVideos();
      }

      return { loadStreamEvents };
    },
    null,
  ).dependencyWatcher;
}

function convertYTBroadcastToEvent(ytBroadcast: IYoutubeLiveBroadcast): IStreamEvent {
  return {
    platform: 'youtube',
    id: ytBroadcast.id,
    date: new Date(
      ytBroadcast.snippet.scheduledStartTime || ytBroadcast.snippet.actualStartTime,
    ).valueOf(),
    title: ytBroadcast.snippet.title,
    status: ytBroadcast.status.lifeCycleStatus === 'complete' ? 'completed' : 'scheduled',
  };
}

function convertFBLiveVideoToEvent(fbLiveVideo: IFacebookLiveVideoExtended): IStreamEvent {
  return {
    platform: 'facebook',
    id: fbLiveVideo.id,
    date: new Date(
      fbLiveVideo.planned_start_time || fbLiveVideo.broadcast_start_time,
    ).valueOf(),
    title: fbLiveVideo.title,
    status: 'scheduled',
    facebook: {
      destinationType: fbLiveVideo.destinationType,
      destinationId: fbLiveVideo.destinationId,
    },
  };
}
