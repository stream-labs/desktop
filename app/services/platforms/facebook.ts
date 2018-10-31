import { StatefulService, mutation } from './../stateful-service';
import { IPlatformService, IPlatformAuth, IChannelInfo, IGame } from '.';
import { HostsService } from '../hosts';
import { SettingsService } from '../settings';
import { Inject } from '../../util/injector';
import { handleErrors, authorizedHeaders } from '../../util/requests';
import { UserService } from '../user';

interface IFacebookPage{
  access_token: string;
  name: string;
  id: string;
}

interface IFacebookServiceState {
  pages: IFacebookPage[];
  activePage: IFacebookPage;
  liveVideoId: number;
  streamProperties: Dictionary<string>;
}

export class FacebookService extends StatefulService<IFacebookServiceState> implements IPlatformService {
  @Inject() hostsService: HostsService;
  @Inject() settingsService: SettingsService;
  @Inject() userService: UserService;

  authWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 800,
    height: 800,
  };

  static initialState: IFacebookServiceState = {
    pages: [],
    activePage: null,
    liveVideoId: null,
    streamProperties: {
      title: 'Streamlabs OBS',
      description: 'Generic description for a live stream'
    }
  };

  @mutation()
  private SET_PAGES(pages: IFacebookPage[]) {
    this.state.pages = pages;
  }

  @mutation()
  private SET_ACTIVE_PAGE(page: IFacebookPage) {
    this.state.activePage = page;
  }

  @mutation()
  private SET_LIVE_VIDEO_ID(id: number) {
    this.state.liveVideoId = id;
  }

  @mutation()
  private SET_STREAM_PROPERTIES(title: string, description: string) {
    this.state.streamProperties = { title, description };
  }

  apiBase = 'https://graph.facebook.com';

  get authUrl() {
    const host = this.hostsService.streamlabs;
    const query = `_=${Date.now()}&skip_splash=true&external=electron&facebook&force_verify&origin=slobs`;
    return `https://${host}/login?${query}`;
  }

  get oauthToken() {
    return this.userService.platform.token;
  }

  getHeaders(authorized = false): Headers {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    if (authorized) headers.append('Authorization', `Bearer ${this.oauthToken}`);
    return headers;
  }

  getPageHeaders(authorized = false): Headers {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    if (authorized) headers.append('Authorization', `Bearer ${this.state.activePage.access_token}`);
    return headers;
  }

  setupStreamSettings(auth: IPlatformAuth) {
    this.fetchStreamKey().then(key => {
      const settings = this.settingsService.getSettingsFormData('Stream');
       settings.forEach(subCategory => {
        subCategory.parameters.forEach(parameter => {
          if (parameter.name === 'service') {
            parameter.value = 'Facebook Live';
          }
           if (parameter.name === 'key') {
            parameter.value = key;
          }
        });
      });
       this.settingsService.setSettings('Stream', settings);
    });
  }

  fetchNewToken(): Promise<void> {
    // FB Doesn't have token refresh, user must login again to update token
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/facebook/refresh`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });
     return fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(response =>
        this.userService.updatePlatformToken(response.access_token)
      );
  }

  fetchRawChannelInfo() {
    return this.fetchUserPagePreference();
  }

  fetchPages() {
    const url = `${this.apiBase}/me/accounts`;
    const headers = this.getHeaders(true);
    const request = new Request(url, { headers });
    return fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(json => {
        this.SET_PAGES(json.data.map((page : IFacebookPage) => {
          return { access_token: page.access_token, name: page.name, id: page.id };
        }));
        const activePage = json.data.filter((page: IFacebookPage) => {
          return this.userService.platform.channelId === page.id;
        });
        if (activePage.length) {
          this.SET_ACTIVE_PAGE({
            access_token: activePage[0].access_token,
            name: activePage[0].name,
            id: activePage[0].id
          });
        }
      });
  }

  fetchUserPagePreference() {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/user/facebook/pages`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });
    return fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(json => {
        if (json.page_type === 'page' && json.page_id) {
          this.userService.updatePlatformChannelId(json.page_id);
        } else {
          this.userService.updatePlatformChannelId('0');
        }
        return json;
      });
  }

  fetchStreamKey(): Promise<string> {
    return this.fetchRawChannelInfo().then(json => `${json.id}-${json.streamKey}`);
  }

  fetchChannelInfo(): Promise<IChannelInfo> {
    return this.fetchRawChannelInfo().then(json => {
      let gameTitle = '';
       if (json.type && json.type.name) {
        gameTitle = json.type.name;
      }
       return {
        title: json.name,
        game: gameTitle
      };
    });
  }

  fetchUserInfo() {
    return Promise.resolve({});
  }

  createLiveVideo() {
    const url = `${this.apiBase}/${this.state.activePage.id}/live_videos`;
    const headers = this.getPageHeaders(true);
    const data = {
      title: this.state.streamProperties.title,
      description: this.state.streamProperties.description,
      game_specs: {
        name: 'League of Legends'
      }
    };
    const request = new Request(url, { method: 'POST', headers, body: JSON.stringify(data) });
    return fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(json => {
        const streamKey = json.stream_url.substr(json.stream_url.lastIndexOf('/') + 1);
        this.SET_LIVE_VIDEO_ID(json.id);
         const settings = this.settingsService.getSettingsFormData('Stream');
         settings.forEach(subCategory => {
          subCategory.parameters.forEach(parameter => {
            if (parameter.name === 'service') {
              parameter.value = 'Facebook Live';
            }
             if (parameter.name === 'key') {
              parameter.value = streamKey;
            }
          });
        });
         this.settingsService.setSettings('Stream', settings);
        return;
      });
  }

  fetchViewerCount(): Promise<number> {
    const url = `${this.apiBase}/${this.state.liveVideoId}?fields=live_views`;
    const headers = this.getPageHeaders(true);
    const request = new Request(url, { headers });
    return fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(json => {
        return json.live_views;
      });
  }

  fbGoLive() {
    return new Promise((resolve) => {
      if (this.state.activePage) {
        this.createLiveVideo().then(() => resolve());
      } else {
        resolve();
      }
    });
  }

  putChannelInfo(streamTitle: string, streamDescription: string): Promise<boolean> {
    this.SET_STREAM_PROPERTIES(streamTitle, streamDescription);
    if (this.state.liveVideoId) {
      const headers = this.getPageHeaders(true);
      const data = {
        title: streamTitle,
        description: streamDescription
      };
       const request = new Request(`${this.apiBase}/${this.state.liveVideoId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
       return fetch(request)
        .then(handleErrors)
        .then(() => true);
    }
    return Promise.resolve(true);
  }

  searchGames(searchString: string): Promise<IGame[]> {
    return Promise.resolve(JSON.parse(''));
  }

  getChatUrl(): Promise<string> {
    return Promise.resolve('https://www.facebook.com/gaming/streamer/chat/');
  }

  beforeGoLive() {
    return this.fetchPages()
        .then(this.fbGoLive);
  }
}
