import Vue from 'vue';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { Inject } from 'util/injector';
import { mutation } from '../stateful-service';
import { ChatbotBaseApiService } from './chatbot-base';
import {
  MediaShareService,
  IMediaShareData,
  IMediaShareBan,
} from 'services/widgets/settings/media-share';

import {
  IChatbotAPIPostResponse,
  ISongRequestPreferencesResponse,
  ISongRequestResponse,
} from './chatbot-interfaces';

// state
interface IChatbotMediaRequestApiServiceState {
  mediaRequestResponse: ISongRequestResponse;
}

export class ChatbotMediaRequestApiService extends PersistentStatefulService<
  IChatbotMediaRequestApiServiceState
> {
  @Inject() mediaShareService: MediaShareService;
  @Inject() chatbotBaseApiService: ChatbotBaseApiService;

  static defaultState: IChatbotMediaRequestApiServiceState = {
    mediaRequestResponse: {
      enabled: false,
      settings: null,
    },
  };

  //
  // GET requests
  //
  fetchSongRequest() {
    return this.chatbotBaseApiService
      .api('GET', 'settings/media-share', {})
      .then((response: ISongRequestResponse) => {
        this.UPDATE_SONG_REQUEST(response);
      });
  }

  //
  // POST, PUT requests
  //
  unbanMedia(media: IMediaShareBan) {
    this.mediaShareService.unbanMedia(media);
  }

  updateSongRequestPreferencesData(data: any) {
    // NOTE: should update type
    this.mediaShareService.saveSettings(data.settings);
  }

  updateSongRequest(data: ISongRequestResponse) {
    return this.chatbotBaseApiService
      .api('POST', 'settings/media-share', data)
      .then((response: IChatbotAPIPostResponse) => {
        if (response.success === true) {
          this.fetchSongRequest();
        }
      });
  }

  //
  // Mutations
  //
  @mutation()
  private UPDATE_SONG_REQUEST(response: ISongRequestResponse) {
    Vue.set(this.state, 'mediaRequestResponse', response);
  }
}
