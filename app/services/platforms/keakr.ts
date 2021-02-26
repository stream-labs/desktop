import { mutation, InheritMutations, ViewHandler } from '../core/stateful-service';
import {
  IPlatformService,
  TPlatformCapability,
  EPlatformCallResult,
  IPlatformRequest,
  IPlatformState,
} from '.';
import { HostsService } from 'services/hosts';
import { Inject } from 'services/core/injector';
import { UserService } from 'services/user';
import { platformAuthorizedRequest, platformRequest } from './utils';
import { StreamSettingsService } from 'services/settings/streaming';
import { IGoLiveSettings } from 'services/streaming';
import { BasePlatformService } from './base-platform';

interface IKeakrServiceState extends IPlatformState {
  scheduledLives: Array<IKeakrKeak>;
  settings: IKeakrStartStreamOptions;
}

interface IKeakrCreateKeakSourceConnectionInformation {
  primaryServer:string;
  hostPort:number;
}

interface IKeakrCreateKeakLivestreamSlot {
  sourceConnectionInformation:IKeakrCreateKeakSourceConnectionInformation;
}

interface IKeakrCreateKeakResponse {
  livestreamSlot:IKeakrCreateKeakLivestreamSlot;
  keakId:string;
}

interface IKeakrKeak {
  id: string;
  title: string;
  shouldStartAt: string;
}

interface IKeakrScheduledLivesResponse {
  items: Array<IKeakrKeak>;
}

export interface IKeakrUpdateVideoOptions {
  liveVideoId: string;
}

export interface IKeakrStartStreamOptions {
  title?: string;
  keakId?: string;
}

const initialState: IKeakrServiceState = {
  scheduledLives: [],
  settings: {
    keakId: 'new'
  },
  isPrepopulated: true,
  ...BasePlatformService.initialState
};

@InheritMutations()
export class KeakrService extends BasePlatformService<IKeakrServiceState>
  implements IPlatformService {
  @Inject() protected hostsService: HostsService;
  @Inject() protected userService: UserService;
  @Inject() private streamSettingsService: StreamSettingsService;

  readonly platform = 'keakr';
  readonly displayName = 'Keakr';

  readonly capabilities = new Set<TPlatformCapability>([
  ]);

  authWindowOptions: Electron.BrowserWindowConstructorOptions = { width: 800, height: 800 };

  static KEAKR_API_ENDPOINT = "https://www.keakr.com"
  static initialState = initialState;

  protected init() {
    // pick up settings from the local storage and start syncing them
    this.syncSettingsWithLocalStorage();
  }
  
  get authUrl() {
    return `${KeakrService.KEAKR_API_ENDPOINT}/en/login/external`;
  }

  get mergeUrl() {
    return `${KeakrService.KEAKR_API_ENDPOINT}/en/login/external`;
  }

  get streamPageUrl(): string {
    return `${KeakrService.KEAKR_API_ENDPOINT}/keak/${this.state.settings.keakId}`;
  }

  get chatUrl(): string {
    return null
  }

  async beforeGoLive(options: IGoLiveSettings) {
    this.SET_KEAK_ID(options.platforms.keakr.keakId)

    if (this.state.settings.keakId == 'new') {
      var result = await platformAuthorizedRequest<IKeakrCreateKeakResponse>('keakr', {
        url: `${KeakrService.KEAKR_API_ENDPOINT}/v1/keaks`,
        body: JSON.stringify({
            "audioEffectId": "1",
            "thumbnailId": "ceca04a1-f71f-4988-b42e-f205d50ea85b",
            "contentType": "live",
            "title": this.state.settings.title,
            "comment": this.state.settings.title,
            "description": this.state.settings.title,
            "livestreamProtocol": "RTMP",
            "publishAfterProcessing": {
                "postOnKeakr": true
            }
          }),
          method: "POST"
      })
  
      this.streamSettingsService.setSettings({
        server: `${result.livestreamSlot.sourceConnectionInformation.primaryServer}:${result.livestreamSlot.sourceConnectionInformation.hostPort}`,
        platform: 'keakr'
      });
      this.SET_KEAK_ID(result.keakId)

    } else {
      var result = await platformAuthorizedRequest<IKeakrCreateKeakResponse>('keakr', {
        url: `${KeakrService.KEAKR_API_ENDPOINT}/v1/keaks/livestream/${this.state.settings.keakId}/start?protocol=RTMP`,
        method: "PATCH"
      })
      this.streamSettingsService.setSettings({
        server: `${result.livestreamSlot.sourceConnectionInformation.primaryServer}:${result.livestreamSlot.sourceConnectionInformation.hostPort}`,
        platform: 'keakr'
      });
    }
    
    await platformAuthorizedRequest<IKeakrCreateKeakResponse>('keakr', {
      url: `${KeakrService.KEAKR_API_ENDPOINT}/v1/keaks/livestream/${this.state.settings.keakId}`,
      method: "PATCH"
    })

  }

  async afterStopStream() {
    await platformAuthorizedRequest<IKeakrCreateKeakResponse>('keakr', {
      url: `${KeakrService.KEAKR_API_ENDPOINT}/v1/keaks/livestream/${this.state.settings.keakId}`,
      method: "DELETE"
    })
  }

  /**
   * update data for the current active video
   */
  async putChannelInfo(info: IKeakrUpdateVideoOptions): Promise<void> {
  }

  async validatePlatform() {
    this.state = initialState
    return EPlatformCallResult.Success;
  }

  getHeaders(req: IPlatformRequest, useToken: boolean | string) {
    const token = typeof useToken === 'string' ? useToken : useToken && this.userService.state.auth.platforms.keakr.token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { "X-Keakr-Access-Token": `${token}` } : {}),
    };
  }

  fetchNewToken(): Promise<void> {
    return Promise.resolve();
  }

  fetchUserInfo() {
    return Promise.resolve({});
  }

  /**
   * fetch prefill data and set default values
   */
  async prepopulateInfo() {
    try {
      var result = await platformAuthorizedRequest<IKeakrScheduledLivesResponse>('keakr', {
        url: `${KeakrService.KEAKR_API_ENDPOINT}/v1/keaks/lives/scheduled`
      })
      this.SET_SCHEDULED_LIVES(result.items)
      this.SET_KEAK_ID('new')
      this.SET_PREPOPULATED(true)
    } catch (e) {
      console.error(e)
    }
  }

  get liveDockEnabled(): boolean {
    return false;
  }

  @mutation()
  protected SET_SCHEDULED_LIVES(scheduledLives: Array<IKeakrKeak>) {
    this.state.scheduledLives = scheduledLives;
  }

  @mutation()
  protected SET_KEAK_ID(keakId:string) {
    if (this.state.settings == null) this.state.settings = {}
    this.state.settings.keakId = keakId;
  }

}
