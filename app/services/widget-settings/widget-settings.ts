import Vue from 'vue';
import { Service } from '../service';
import { HostsService } from '../hosts';
import { Inject } from '../../util/injector';
import { mutation } from '../../services/stateful-service';
import { IPlatformAuth } from '../../services/platforms';
import { UserService } from '../../services/user';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { WidgetDefinitions } from '../widgets';
import { fonts } from './fonts';
import {
  handleErrors,
  requiresToken,
  authorizedHeaders
} from '../../util/requests';

// Interfaces go at top of service file
// Define the shape of the values
// Use the question mark when the item does not have a default defined
interface IUserServiceState {
  auth?: IPlatformAuth;
}

export interface IBitGoalSettings {
  goal: {
    title: string;
    goal_amount: number;
    manual_goal_amount: number;
    ends_at: string;
  };
  settings: {
    background_color: string,
    bar_color: string,
    bar_bg_color: string,
    text_color: string,
    bar_text_color: string,
    font: string,
    bar_thickness: string,
    layout: string
    custom_enabled: boolean,
    custom_html?: string;
    custom_css?: string;
    custom_js?: string;
  };
  has_goal: boolean;
  widget: object;
  demo: object;
  show_bar: string;
  custom_defaults: {
    html?: string;
    css?: string;
    js?: string;
  };
}

// Donation Goal
export interface IDonationGoalSettings {
  goal: {
    title: string,
    goal_amount: number,
    manual_goal_amount: number,
    ends_at: string,
  };
  widget: object;
  has_goal: boolean;
  demo: object;
  show_bar: string;
  settings: {
    custom_html?: string;
    custom_css?: string;
    custom_js?: string;
    bar_color: string,
    bar_bg_color: string,
    text_color: string,
    bar_text_color: string,
    font: string,
    bar_thickness: string,
    custom_enabled: boolean,
    layout: string;
    background_color: string;
  };
  custom_defaults: {
    html?: string;
    css?: string;
    js?: string;
  };
}

export interface IChatBoxSettings {
  widget: {
    url: string,
    simulate: string
  };
  settings: {
    background_color: string,
    text_color: string,
    show_moderator_icons: boolean,
    show_subscriber_icons: boolean,
    show_turbo_icons: boolean,
    show_premium_icons: boolean,
    show_bits_icons: boolean,
    show_coin_icons: boolean,
    show_bttv_emotes: boolean,
    show_franker_emotes: boolean,
    show_smf_emotes: boolean,
    always_show_messages: boolean,
    hide_common_chat_bots: boolean,
    message_hide_delay: number,
    text_size: number,
    muted_chatters: string,
    hide_commands: boolean,
    custom_enabled: boolean,
    custom_html: string,
    custom_css: string,
    custom_js: string,
    custom_json: null
  };
  custom: {
    html: string,
    css: string,
    js: string
  };
  platforms: {
    twitch_account: string
  };
  platforms2: {
    twitch_account: string,
    facebook_account: string,
    youtube_account: string,
    periscope_account: string,
    mixer_account: string
  };
  thirdpartyplatforms: {
    tiltify:{
      id: number,
      user_id: number,
      tiltify_id: number,
      campaign_id:null,
      name: string,
      email: string,
      access_token: string,
      created_at: string,
      updated_at: string
    },
    tipeeestream: {
      id: number,
      user_id: number,
      tipeeestream_id: number,
      name: string,
      access_token: string,
      refresh_token: string,
      created_at: string,
      updated_at: string
    }
  };
}

export class WidgetSettingsService extends Service {
  @Inject() hostsService: HostsService;
  @Inject() userService: UserService;

  // Get widget url's for the webview previews
  getWidgetUrl(widgetType: string) {
    const host = this.hostsService.streamlabs;
    const token = this.userService.widgetToken;

    switch (widgetType) {
      case 'AlertBox':
        return `https://${host}/alert-box/v4?token=${token}`;

      case 'BitGoal':
        return `https://${host}/widgets/bit-goal?token=${token}`;

      case 'ChatBox':
        return `https://${host}/widgets/chat-box/v1?token=${token}`;

      case 'DonationGoal':
        return `https://${host}/widgets/donation-goal?token=${token}`;

      case 'DonationTicker':
        return `https://${host}/widgets/donation-ticker?token=${token}`;

      case 'EndCredits':
        return `https://${host}/widgets/end-credits?token=${token}`;

      case 'EventList':
        return `https://${host}/widgets/event-list/v1?token=${token}`;

      case 'FollowerGoal':
        return `https://${host}/widgets/follower-goal?token=${token}`;

      case 'StreamBoss':
        return `https://${host}/widgets/streamboss?token=${token}`;

      case 'TheJar':
        return `https://${host}/widgets/tip-jar/v1?token=${token}`;

      case 'ViewerCount':
        return `https://${host}/widgets/viewer-count?token=${token}`;

      case 'Wheel':
        return `https://${host}/widgets/wheel?token=${token}`;
    }
  }

  // Some defaults we will have to fetch from server to see if they exist
  // Here we check to see if user has custom code - if not they get default

  // Bit Goal
  fetchBitGoalSettings(response: IBitGoalSettings): IBitGoalSettings {
    response.settings.custom_html =
      response.settings.custom_html || response.custom_defaults.html;
    response.settings.custom_css =
      response.settings.custom_css || response.custom_defaults.css;
    response.settings.custom_js =
      response.settings.custom_js || response.custom_defaults.js;

    return response;
  }

  getBitGoalSettings(): Promise<IBitGoalSettings> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/widget/bitgoal/settings`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(response => {
        return this.fetchBitGoalSettings(response);
      });
  }

  postBitGoal(widgetData: IBitGoalSettings) {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/widget/bitgoal`;
    const headers = authorizedHeaders(this.userService.apiToken);
    headers.append('Content-Type', 'application/json');
    const bodyBitGoal = {
      ends_at: widgetData.goal['ends_at'],
      goal_amount: widgetData.goal['goal_amount'],
      manual_goal_amount: widgetData.goal['manual_goal_amount'],
      title: widgetData.goal['title']
    };

    const request = new Request(url, {
      headers,
      method: 'POST',
      body: JSON.stringify(bodyBitGoal)
    });

    return fetch(request)
      .then(response => { return response.json();});
  }

  postBitGoalSettings(widgetData: IBitGoalSettings) {
    console.log(widgetData);
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/widget/bitgoal/settings`;
    const headers = authorizedHeaders(this.userService.apiToken);
    headers.append('Content-Type', 'application/json');
    const bodyBitGoalSettings = {
      background_color: widgetData.settings['background_color'],
      bar_bg_color: widgetData.settings['bar_bg_color'],
      bar_color: widgetData.settings['bar_color'],
      bar_text_color: widgetData.settings['bar_text_color'],
      bar_thickness: widgetData.settings['bar_thickness'],
      custom_enabled: widgetData.settings['custom_enabled'],
      custom_html: widgetData.settings['custom_html'],
      custom_css: widgetData.settings['custom_css'],
      custom_js: widgetData.settings['custom_js'],
      font: widgetData.settings['font'],
      layout: widgetData.settings['layout'],
      text_color: widgetData.settings['text_color'],
    };

    const request = new Request(url, {
      headers,
      method: 'POST',
      body: JSON.stringify(bodyBitGoalSettings)
    });

    return fetch(request)
      .then(response => { return response.json();});
  }

  deleteBitGoal() {
    const host = this.hostsService.streamlabs;
    const token = this.userService.widgetToken;
    const url = `https://${host}/api/v5/slobs/widget/bitgoal`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, {
      headers,
      method: 'DELETE'
    });

    return fetch(request);
  }

  defaultBitGoalSettings: IBitGoalSettings = {
    goal: {
      title: 'My Bit Goal',
      goal_amount: 100,
      manual_goal_amount: 0,
      ends_at: ''
    },
    settings: {
      background_color: '#000000',
      bar_color: '#46E65A',
      bar_bg_color: '#DDDDDD',
      text_color: '#FFFFFF',
      bar_text_color: '#000000',
      font: 'Open Sans',
      bar_thickness: '48',
      custom_enabled: false,
      custom_html: '',
      custom_css: '',
      custom_js: '',
      layout: 'standard'
    },
    has_goal: false,
    widget: {},
    demo: {},
    show_bar: '',
    custom_defaults: {},
  };

  // Chat Box
  fetchChatBoxSettings(response: IChatBoxSettings): IChatBoxSettings {
    response.settings.custom_html =
      response.settings.custom_html || response.custom.html;
    response.settings.custom_css =
      response.settings.custom_css || response.custom.css;
    response.settings.custom_js =
      response.settings.custom_js || response.custom.js;

    return response;
  }

  getChatBoxSettings(): Promise<IChatBoxSettings> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/widget/chatbox`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(response => {
        return this.fetchChatBoxSettings(response);
      });
  }

  postChatBoxSettings(widgetData: IChatBoxSettings) {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/widget/chatbox`;
    const headers = authorizedHeaders(this.userService.apiToken);
    headers.append('Content-Type', 'application/json');
    const bodyChatBoxSettings = {

    };

    const request = new Request(url, {
      headers,
      method: 'POST',
      body: JSON.stringify(bodyChatBoxSettings)
    });

    return fetch(request)
      .then(response => { return response.json();});
  }

  defaultChatBoxSettings: IChatBoxSettings = {
    widget: {
      url: '',
      simulate: ''
    },
    settings: {
      background_color: '',
      text_color: '',
      show_moderator_icons: true,
      show_subscriber_icons: true,
      show_turbo_icons: true,
      show_premium_icons: true,
      show_bits_icons: true,
      show_coin_icons: true,
      show_bttv_emotes: true,
      show_franker_emotes: true,
      show_smf_emotes: true,
      always_show_messages: true,
      hide_common_chat_bots: true,
      message_hide_delay: 1,
      text_size: 28,
      muted_chatters: '',
      hide_commands: true,
      custom_enabled: true,
      custom_html: '',
      custom_css: '',
      custom_js: '',
      custom_json: null
    },
    custom: {
      html: '',
      css: '',
      js: ''
    },
    platforms: {
      twitch_account: ''
    },
    platforms2: {
      twitch_account: '',
      facebook_account: '',
      youtube_account: '',
      periscope_account: '',
      mixer_account: ''
    },
    thirdpartyplatforms: {
      tiltify:{
        id: null,
        user_id: null,
        tiltify_id: null,
        campaign_id:null,
        name: '',
        email: '',
        access_token: '',
        created_at: '',
        updated_at: ''
      },
      tipeeestream: {
        id: null,
        user_id: null,
        tipeeestream_id: null,
        name: '',
        access_token: '',
        refresh_token: '',
        created_at: '',
        updated_at: ''
      }
    }
  };

  // Donation Goal
  fetchDonationGoalSettings(response: IDonationGoalSettings): IDonationGoalSettings {
    response.settings.custom_html =
      response.settings.custom_html || response.custom_defaults.html;
    response.settings.custom_css =
      response.settings.custom_css || response.custom_defaults.css;
    response.settings.custom_js =
      response.settings.custom_js || response.custom_defaults.js;

    return response;
  }

  getDonationGoalSettings(): Promise<IDonationGoalSettings> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/widget/donationgoal`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(response => {
        return this.fetchDonationGoalSettings(response);
      });
  }

  postDonationGoal(widgetData: IDonationGoalSettings) {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/widget/donationgoal`;
    const headers = authorizedHeaders(this.userService.apiToken);
    headers.append('Content-Type', 'application/json');
    const bodyBitGoal = {
      ends_at: widgetData.goal['ends_at'],
      goal_amount: widgetData.goal['goal_amount'],
      manual_goal_amount: widgetData.goal['manual_goal_amount'],
      title: widgetData.goal['title']
    };

    const request = new Request(url, {
      headers,
      method: 'POST',
      body: JSON.stringify(bodyBitGoal)
    });

    return fetch(request)
      .then(response => { return response.json();});
  }

  postDonationGoalSettings(widgetData: IDonationGoalSettings) {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/widget/donationgoal`;
    const headers = authorizedHeaders(this.userService.apiToken);
    headers.append('Content-Type', 'application/json');
    const bodyDonationGoalSettings = {
      custom_enabled: widgetData.settings['custom_enabled'],
      custom_html: widgetData.settings['custom_html'],
      custom_css: widgetData.settings['custom_css'],
      custom_js: widgetData.settings['custom_js'],
      bar_color: widgetData.settings['bar_color'],
      text_color: widgetData.settings['text_color'],
      bar_text_color: widgetData.settings['bar_text_color'],
      font: widgetData.settings['font'],
      bar_thickness: widgetData.settings['bar_thickness'],
      layout: widgetData.settings['layout']
    };

    const request = new Request(url, {
      headers,
      method: 'POST',
      body: JSON.stringify(bodyDonationGoalSettings)
    });

    return fetch(request)
      .then(response => { return response.json();});
  }

  deleteDonationGoal() {
    const host = this.hostsService.streamlabs;
    const token = this.userService.widgetToken;
    const url = `https://${host}/api/v5/slobs/widget/donationgoal`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, {
      headers,
      method: 'DELETE'
    });

    return fetch(request);
  }

  defaultDonationGoalSettings: IDonationGoalSettings = {
    settings: {
      background_color: '#000000',
      bar_color: '#46E65A',
      bar_bg_color: '#DDDDDD',
      text_color: '#FFFFFF',
      bar_text_color: '#000000',
      font: 'Open Sans',
      bar_thickness: '48',
      custom_enabled: false,
      custom_html: '',
      custom_css: '',
      custom_js: '',
      layout: 'standard'
    },
    goal: {
      title: 'My Bit Goal',
      goal_amount: 100,
      manual_goal_amount: 0,
      ends_at: ''
    },
    widget: {},
    has_goal: false,
    demo: {},
    show_bar: '',
    custom_defaults: {}
  };
}
