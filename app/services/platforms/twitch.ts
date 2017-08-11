import { Service } from '../service';
import { IPlatformService, IPlatformAuth } from '.';
import { HostsService } from '../hosts';
import { SettingsService } from '../settings';
import { Inject } from '../../util/injector';

export class TwitchService extends Service implements IPlatformService {

  @Inject()
  hostsService: HostsService;

  @Inject()
  settingsService: SettingsService;

  authWindowOptions: Electron.BrowserWindowOptions = {
    width: 600,
    height: 800
  };

  // Streamlabs Production Twitch OAuth Client ID
  clientId = '8bmp6j83z5w4mepq0dn0q1a7g186azi';

  get authUrl() {
    const host = this.hostsService.streamlabs;
    const query = `_=${Date.now()}&skip_splash=true&external=electron&twitch&force_verify&scope=channel_read`;
    return `https://${host}/login?${query}`;
  }


  // TODO: Some of this code could probably eventually be
  // shared with the Youtube platform.
  setupStreamSettings(auth: IPlatformAuth) {
    this.fetchChannelInfo(auth.platform.token).then(info => {
      const settings = this.settingsService.getSettingsFormData('Stream');

      settings.forEach(subCategory => {
        subCategory.parameters.forEach(parameter => {
          if (parameter.name === 'service') {
            parameter.value = 'Twitch';
          }

          if (parameter.name === 'key') {
            parameter.value = info.stream_key;
          }
        });
      });

      this.settingsService.setSettings('Stream', settings);
    });
  }


  fetchChannelInfo(token: string) {
    const headers = new Headers();

    headers.append('Client-ID', this.clientId);
    headers.append('Authorization', `OAuth ${token}`);

    const request = new Request('https://api.twitch.tv/kraken/channel', { headers });

    return fetch(request).then(response => {
      return response.json();
    });
  }

  fetchLiveStreamInfo(twitchId: string) {
    const headers = new Headers();

    headers.append('Client-Id', this.clientId);
    headers.append('Accept', 'application/vnd.twitchtv.v5+json');

    const request = new Request(`https://api.twitch.tv/kraken/streams/${twitchId}`, { headers });

    return fetch(request).then(response => {
      return response.json();
    });
  }

}
