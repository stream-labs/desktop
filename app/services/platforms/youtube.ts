import { Service } from '../service';
import { IPlatformService, IStreamInfo } from '.';
import { HostsService } from '../hosts';
import { Inject } from '../util/injector';

export class YoutubeService extends Service implements IPlatformService {

  hostsService: HostsService = HostsService.instance;

  authWindowOptions: Electron.BrowserWindowOptions = {
    width: 1000,
    height: 600
  };

  get authUrl() {
    const host = this.hostsService.streamlabs;
    return `https://${host}/login?_=${Date.now()}&skip_splash=true&external=electron&youtube&force_verify`;
  }


  setupStreamSettings() {
    // TODO: Not currently implemented
  }

  fetchLiveStreamInfo(youtubeId: string): Promise<IStreamInfo> {
    // TODO: Harsha
    return Promise.resolve({ status: '', viewers: 0 });
  }

  putLiveStreamTitle(streamTitle: string, youtubeId: string, oauthToken: string) {
    // TODO: Harsha
    return Promise.resolve(true);
  }

}
