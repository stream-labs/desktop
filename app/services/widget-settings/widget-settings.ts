import { HostsService } from '../hosts';
import { Inject } from '../../util/injector';
import { UserService } from 'services/user';
import {
  handleErrors,
  authorizedHeaders
} from '../../util/requests';
import { WidgetType } from 'services/widgets';
import { mutation, StatefulService } from 'services/stateful-service';
import { Subject } from 'rxjs/Subject';



export interface IWidgetTab {
  title: string;
  name: string;
  fetchUrl: string;
  saveUrl: string;
  resetUrl: string;
  resetMethod: THttpMethod;
  autosave: boolean;
  showControls: boolean;
}

export interface IWidgetSettings {
  custom_enabled: boolean;
  custom_html: string;
  custom_css: string;
  custom_js: string;
}

export interface IWidgetData {

  type: WidgetType;

  settings: IWidgetSettings;

  custom_defaults: {
    html: string;
    css: string;
    js: string;
  };
}

export type THttpMethod = 'GET' | 'POST' | 'DELETE';

export const CODE_EDITOR_TABS: (Partial<IWidgetTab> & { name: string })[] = [
  { name: 'HTML', showControls: false, autosave: false },
  { name: 'CSS', showControls: false, autosave: false },
  { name: 'JS', showControls: false, autosave: false }
];

/**
 * base class for widget settings
 * TODO: join this service with WidgetsService.ts after widgets rewrite
 */
export abstract class WidgetSettingsService<TWidgetData extends IWidgetData> extends StatefulService<IWidgetData> {
  static initialState = {};

  @Inject() private hostsService: HostsService;
  @Inject() private userService: UserService;

  dataUpdated = new Subject<TWidgetData>();

  protected abstract getWidgetUrl(): string;
  protected abstract getDataUrl(): string;
  protected abstract getWidgetType(): WidgetType;

  protected tabs: ({ name: string } & Partial<IWidgetTab>)[] = [{ name: 'settings' }];

  getTabs(): IWidgetTab[] {
    return this.tabs.map(tab => {
      const resetMethod: THttpMethod = 'DELETE';

      const fetchUrl = this.getDataUrl() || tab.fetchUrl;
      const saveUrl = tab.saveUrl || fetchUrl;
      const resetUrl = tab.resetUrl || saveUrl;

      return {
        autosave: true,
        title: tab.name.charAt(0).toUpperCase() + tab.name.substr(1),
        fetchUrl,
        saveUrl,
        resetUrl,
        resetMethod,
        showControls: true,
        ...tab
      };
    });
  }

  getTab(name: string) {
    return this.getTabs().find(tab => tab.name === name);
  }

  async fetchData(): Promise<TWidgetData> {
    let data = await this.request({
      url: this.getDataUrl(),
      method: 'GET'
    });
    data = this.handleDataAfterFetch(data);
    this.SET_STATE(data);
    this.dataUpdated.next(data);
    return data;
  }

  protected handleDataAfterFetch(data: any): TWidgetData {

    // patch fetched data to have the same data format

    if (data.custom) data.custom_defaults = data.custom;
    data.type = this.getWidgetType();


    // widget-specific patching
    return this.patchData(data);
  }

  /**
   * override this method to patch data after fetching
   */
  protected patchData(data: TWidgetData) {
    return data;
  }

  getMetadata(): Dictionary<any> {
    return {};
  }

  async saveData(data: TWidgetData, tabName? :string, method: THttpMethod = 'POST'): Promise<TWidgetData> {
    const tab = this.getTab(tabName);
    const url = tab && tab.saveUrl ? tab.saveUrl : this.getDataUrl();
    await this.request({
      url,
      method,
      body: data
    });
    return this.fetchData();
  }

  async reset(tabName?: string): Promise<TWidgetData> {
    const tab = this.getTab(tabName);
    const url = tab ? tab.resetUrl : this.getDataUrl();
    const method = tab ? tab.resetMethod : 'DELETE';
    await this.request({
      url,
      method
    });
    return this.fetchData();
  }

  async request(req: { url: string, method?: THttpMethod, body?: any }): Promise<TWidgetData> {
    const method = req.method || 'GET';
    const headers = authorizedHeaders(this.getApiToken());
    headers.append('Content-Type', 'application/json');

    const request = new Request(req.url, {
      headers,
      method,
      body: req.body ? JSON.stringify(req.body) : void 0
    });

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json());
  }

  protected getHost(): string {
    return this.hostsService.streamlabs;
  }

  protected getWidgetToken(): string {
    return this.userService.widgetToken;
  }

  protected getApiToken(): string {
    return this.userService.apiToken;
  }

  @mutation()
  private SET_STATE(state: TWidgetData) {
    this.state = state;
  }

  //
  // // Get widget url's for the webview previews
  // getWidgetUrl(widgetType: string) {
  //   const host = this.hostsService.streamlabs;
  //   const token = this.userService.widgetToken;
  //
  //   switch (widgetType) {
  //     case 'AlertBox':
  //       return `https://${host}/alert-box/v4?token=${token}`;
  //
  //     case 'BitGoal':
  //       return `https://${host}/widgets/bit-goal?token=${token}`;
  //
  //     case 'ChatBox':
  //       return `https://${host}/widgets/chat-box/v1?token=${token}`;
  //
  //     case 'DonationGoal':
  //       return `https://${host}/widgets/donation-goal?token=${token}`;
  //
  //     case 'DonationTicker':
  //       return `https://${host}/widgets/donation-ticker?token=${token}`;
  //
  //     case 'EndCredits':
  //       return `https://${host}/widgets/end-credits?token=${token}`;
  //
  //     case 'EventList':
  //       return `https://${host}/widgets/event-list/v1?token=${token}`;
  //
  //     case 'FollowerGoal':
  //       return `https://${host}/widgets/follower-goal?token=${token}`;
  //
  //     case 'StreamBoss':
  //       return `https://${host}/widgets/streamboss?token=${token}`;
  //
  //     case 'TheJar':
  //       return `https://${host}/widgets/tip-jar/v1?token=${token}`;
  //
  //     case 'ViewerCount':
  //       return `https://${host}/widgets/viewer-count?token=${token}`;
  //
  //     case 'Wheel':
  //       return `https://${host}/widgets/wheel?token=${token}`;
  //   }
  // }


  // defaultBitGoalSettings: IBitGoalSettings = {
  //   goal: {
  //     title: 'My Bit Goal',
  //     goal_amount: 100,
  //     manual_goal_amount: 0,
  //     ends_at: ''
  //   },
  //   settings: {
  //     background_color: '#000000',
  //     bar_color: '#46E65A',
  //     bar_bg_color: '#DDDDDD',
  //     text_color: '#FFFFFF',
  //     bar_text_color: '#000000',
  //     font: 'Open Sans',
  //     bar_thickness: '48',
  //     custom_enabled: false,
  //     custom_html: '',
  //     custom_css: '',
  //     custom_js: '',
  //     layout: 'standard'
  //   },
  //   has_goal: false,
  //   widget: {},
  //   demo: {},
  //   show_bar: '',
  //   custom_defaults: {},
  // };

  // Chat Box



  // defaultChatBoxSettings: IChatBoxSettings = {
  //   widget: {
  //     url: '',
  //     simulate: ''
  //   },
  //   settings: {
  //     background_color: '',
  //     text_color: '',
  //     show_moderator_icons: true,
  //     show_subscriber_icons: true,
  //     show_turbo_icons: true,
  //     show_premium_icons: true,
  //     show_bits_icons: true,
  //     show_coin_icons: true,
  //     show_bttv_emotes: true,
  //     show_franker_emotes: true,
  //     show_smf_emotes: true,
  //     always_show_messages: true,
  //     hide_common_chat_bots: true,
  //     message_hide_delay: 1,
  //     text_size: 28,
  //     muted_chatters: '',
  //     hide_commands: true,
  //     custom_enabled: true,
  //     custom_html: '',
  //     custom_css: '',
  //     custom_js: '',
  //     custom_json: null
  //   },
  //   custom: {
  //     html: '',
  //     css: '',
  //     js: ''
  //   },
  //   platforms: {
  //     twitch_account: ''
  //   },
  //   platforms2: {
  //     twitch_account: '',
  //     facebook_account: '',
  //     youtube_account: '',
  //     periscope_account: '',
  //     mixer_account: ''
  //   },
  //   thirdpartyplatforms: {
  //     tiltify:{
  //       id: null,
  //       user_id: null,
  //       tiltify_id: null,
  //       campaign_id:null,
  //       name: '',
  //       email: '',
  //       access_token: '',
  //       created_at: '',
  //       updated_at: ''
  //     },
  //     tipeeestream: {
  //       id: null,
  //       user_id: null,
  //       tipeeestream_id: null,
  //       name: '',
  //       access_token: '',
  //       refresh_token: '',
  //       created_at: '',
  //       updated_at: ''
  //     }
  //   }
  // };

  //
  // defaultDonationGoalSettings: IDonationGoalSettings = {
  //   settings: {
  //     background_color: '#000000',
  //     bar_color: '#46E65A',
  //     bar_bg_color: '#DDDDDD',
  //     text_color: '#FFFFFF',
  //     bar_text_color: '#000000',
  //     font: 'Open Sans',
  //     bar_thickness: '48',
  //     custom_enabled: false,
  //     custom_html: '',
  //     custom_css: '',
  //     custom_js: '',
  //     layout: 'standard'
  //   },
  //   goal: {
  //     title: 'My Bit Goal',
  //     goal_amount: 100,
  //     manual_goal_amount: 0,
  //     ends_at: ''
  //   },
  //   widget: {},
  //   has_goal: false,
  //   demo: {},
  //   show_bar: '',
  //   custom_defaults: {}
  // };
}
