import Vue from 'vue';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { Inject } from 'util/injector';
import { mutation } from '../stateful-service';
import { ChatbotBaseApiService } from './chatbot-base';
import {
  MediaShareService,
  IMediaShareData,
  IMediaShareBan
} from 'services/widgets/settings/media-share';

import {
  IChatbotAPIPostResponse,
  ISongRequestPreferencesResponse,
  ISongRequestResponse
} from './chatbot-interfaces';

// state
interface IChatbotSongRequestApiServiceState {
  songRequestPreferencesResponse: ISongRequestPreferencesResponse;
  songRequestResponse: ISongRequestResponse;
}

export class ChatbotSongRequestApiService extends PersistentStatefulService<IChatbotSongRequestApiServiceState> {
  @Inject() mediaShareService: MediaShareService;
  @Inject() chatbotBaseApiService: ChatbotBaseApiService;

  static defaultState: IChatbotSongRequestApiServiceState = {
    songRequestPreferencesResponse: {
      banned_media: [],
      settings: null
    },
    songRequestResponse: {
      enabled: false,
      settings: null
    }
  };

  //
  // GET requests
  //
  fetchSongRequestPreferencesData() {
    return this.mediaShareService
      .fetchData()
      .then((response: IMediaShareData) => {
        this.UPDATE_SONG_REQUEST_PREFERENCES(
          response as ISongRequestPreferencesResponse
        );
      });
  }

  fetchSongRequest() {
    return this.chatbotBaseApiService.api('GET', 'settings/songrequest', {}).then(
      (response: ISongRequestResponse) => {
        this.UPDATE_SONG_REQUEST(response);
      }
    );
  }

  //
  // POST, PUT requests
  //
  unbanMedia(media: IMediaShareBan) {
    this.mediaShareService.unbanMedia(media);
  }

  updateSongRequestPreferencesData(data: any) {
    // NOTE: should update type
    this.mediaShareService.saveData(data.settings);
  }

  updateSongRequest(data: ISongRequestResponse) {
    return this.chatbotBaseApiService.api('POST', 'settings/songrequest', data).then(
      (response: IChatbotAPIPostResponse) => {
        if (response.success === true) {
          this.fetchSongRequest();
        }
      }
    );
  }

  //
  // Mutations
  //
  @mutation()
  private UPDATE_SONG_REQUEST_PREFERENCES(
    response: ISongRequestPreferencesResponse
  ) {
    Vue.set(this.state, 'songRequestPreferencesResponse', response);
  }

  @mutation()
  private UPDATE_SONG_REQUEST(response: ISongRequestResponse) {
    Vue.set(this.state, 'songRequestResponse', response);
  }
}
