import { Service } from '../service';
import { IPlatformService, IStreamInfo, IPlatformAuth } from '.';
import { HostsService } from '../hosts';
import { SettingsService } from '../settings';
import { Inject } from '../../util/injector';

export class YoutubeService extends Service implements IPlatformService {

  @Inject()
  hostsService: HostsService;

  @Inject()
  settingsService: SettingsService;

  authWindowOptions: Electron.BrowserWindowOptions = {
    width: 1000,
    height: 600
  };

  apiBase = 'https://www.googleapis.com/youtube/v3';
  liveStreamId = '';

  get authUrl() {
    const host = this.hostsService.streamlabs;
    return `https://${host}/login?_=${Date.now()}&skip_splash=true&external=electron&youtube&force_verify`;
  }


  setupStreamSettings(auth: IPlatformAuth) {
    this.fetchBoundStreamId(auth.platform.token).then(boundStreamId => {
      this.fetchStreamKey(boundStreamId, auth.platform.token).then(streamKey => {
        const settings = this.settingsService.getSettingsFormData('Stream');

        settings.forEach(subCategory => {
          subCategory.parameters.forEach(parameter => {
            if (parameter.name === 'service') {
              parameter.value = 'YouTube / YouTube Gaming';
            }

            if (parameter.name === 'key') {
              parameter.value = streamKey;
            }
          });
        });

        this.settingsService.setSettings('Stream', settings);
      });
    });
  }

  fetchBoundStreamId(oauthToken: string) {
    const endpoint = `liveBroadcasts?part=contentDetails&mine=true&broadcastType=persistent`;
    const request = new Request(`${this.apiBase}/${endpoint}&access_token=${oauthToken}`);

    return fetch(request).then(response => {
      return response.json();
    }).then(json => {
      return json.items[0].contentDetails.boundStreamId;
    });
  }

  fetchStreamKey(id:string, oauthToken: string) {
    const endpoint = `liveStreams?part=cdn&id=${id}`;
    const request = new Request(`${this.apiBase}/${endpoint}&access_token=${oauthToken}`);

    return fetch(request).then(response => {
      return response.json();
    }).then(json => {
      return json.items[0].cdn.ingestionInfo.streamName;
    });
  }

  fetchLiveStreamInfo(youtubeId: string, oauthToken: string): Promise<IStreamInfo> {
    return this.getLiveStreamId(oauthToken, false).then(() => {
      const endpoint = `videos?part=snippet,liveStreamingDetails`;
      const request = new Request(`${this.apiBase}/${endpoint}&id=${this.liveStreamId}&access_token=${oauthToken}`);

      return fetch(request).then(response => {
        return response.json();
      }).then(json => {
        return {
          status: json.items[0].snippet.localized.title,
          viewers: json.items[0].liveStreamingDetails.concurrentViewers || 0,
          game: ''
        };
      }).catch(() => {
        return { status: '', viewers: 0, game: '' };
      });
    });
  }

  putStreamInfo(streamTitle: string, streamGame: string, youtubeId: string, oauthToken: string) {
    const headers = new Headers();

    headers.append('Content-Type', 'application/json');

    const data = { snippet: { title : streamTitle }, id: this.liveStreamId };

    const endpoint = `liveBroadcasts?part=snippet`;

    const request = new Request(`${this.apiBase}/${endpoint}&access_token=${oauthToken}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });

    return fetch(request).then(response => {
      return response.json();
    }).then(json => {
      return true;
    }).catch(() => {
      return false;
    });
  }

  searchGames(searchString: string) {
    return Promise.resolve(JSON.parse(''));
  }

  getLiveStreamId(oauthToken: string, forceGet: boolean): Promise<void> {
    if (this.liveStreamId && !forceGet) {
      return Promise.resolve();
    }
    const endpoint = `liveBroadcasts?part=id&broadcastStatus=active&broadcastType=persistent`;
    const request = new Request(`${this.apiBase}/${endpoint}&access_token=${oauthToken}`);

    return fetch(request).then(response => {
      return response.json();
    }).then(json => {
      if (json.items.length) {
        this.liveStreamId = json.items[0].id;
      }
    });
  }

  getChatUrl(username: string, oauthToken: string, mode: string) {
    const endpoint = `liveBroadcasts?part=id&mine=true&broadcastType=persistent`;
    const request = new Request(`${this.apiBase}/${endpoint}&access_token=${oauthToken}`);

    return fetch(request).then(response => {
      return response.json();
    }).then(json => {
      const youtubeDomain = mode === 'day' ? 'https://youtube.com' : 'https://gaming.youtube.com';
      return `${youtubeDomain}/live_chat?v=${json.items[0].id}&is_popout=1`;
    });
  }
}
