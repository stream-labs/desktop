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

interface IBitGoalSettings {
  goal: {
    title: string;
  };
  settings: {
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
  custom_html?: string;
  custom_css?: string;
  custom_js?: string;
  data: {
    title: string;
    goal_amount: number;
    manual_goal_amount: number;
    ends_at: string;
  };
}

// Donation Goal
interface IDonationGoalSettings {
  donationGoalSettings: object;
  goal: {
    title: string;
  };
  widget: object;
  has_goal: boolean;
  demo: object;
  show_bar: string;
  custom_defaults: {};
  custom_html?: string;
  custom_css?: string;
  custom_js?: string;
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

  // AJAX requests and calls to server live inside the class

  // Bit Goal
  getBitGoalSettings(): Promise<IBitGoalSettings> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/widget/bitgoal/settings`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(response => {
        return this.fetchBitGoalSettings(response);
      });
  }

  // Some defaults we will have to fetch from server to see if they exist
  // Here we check to see if user has custom code - if not they get default
  fetchBitGoalSettings(response: IBitGoalSettings): IBitGoalSettings {
    response.settings.custom_html =
      response.settings.custom_html || response.custom_defaults.html;
    response.settings.custom_css =
      response.settings.custom_css || response.custom_defaults.css;
    response.settings.custom_js =
      response.settings.custom_js || response.custom_defaults.js;

    return response;
  }

  defaultBitGoalSettings: IBitGoalSettings = {
    goal: {
      title: 'My Bit Goal'
    },
    settings: {},
    has_goal: false,
    widget: {},
    demo: {},
    show_bar: '',
    custom_defaults: {},
    data: {
      title: 'My Bit Goal',
      goal_amount: 100,
      manual_goal_amount: 0,
      ends_at: ''
    }
  };

  // defaultDonationGoalSettings: IDonationGoalSettings = {
  //   donationGoalSettings: {},
  //   goal: {
  //     title: 'Donation Goal Title'
  //   },
  //   widget: {},
  //   has_goal: false,
  //   demo: {},
  //   show_bar: '',
  //   custom_defaults: {},
  //   custom_html: this.donationGoalDefaultHTML,
  //   custom_css: this.donationGoalDefaultCSS,
  //   custom_js: this.donationGoalDefaultJS
  // };
}
