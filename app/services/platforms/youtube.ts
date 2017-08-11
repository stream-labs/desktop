import { Service, Inject } from '../service';
import { IPlatformService } from '.';
import { HostsService } from '../hosts';

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

  fetchLiveStreamInfo(youtubeId: string) {
    // TODO: Harsha
    return {};
  }

}
