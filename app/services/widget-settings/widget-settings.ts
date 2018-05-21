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

// Interfaces go at top of service file

interface IUserServiceState {
  auth?: IPlatformAuth;
}
// Define the shape of the values
interface IBitGoalSettings {
  // Use the question mark when the item does not have a default defined
  goal: {
    title: string;
  };
  settings: object;
  has_goal: boolean;
  widget: object;
  demo: object;
  show_bar: string;
  custom_defaults: object;
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
  custom_html: string;
  custom_css: string;
  custom_js: string;
}

// AJAX requests and calls to service live inside the class
export class WidgetSettingsService extends Service {
  @Inject() hostsService: HostsService;
  @Inject() userService: UserService;

  // Get widget iframe for previews
  getWidgetUrl(widgetType: string) {
    const host = this.hostsService.streamlabs;
    const token = this.userService.widgetToken;

    switch (widgetType) {
      case 'BitGoal':
      return `https://${host}/widgets/bit-goal?token=${token}`

      case 'DonationGoal':
      return `https://${host}/widgets/donation-goal?token=${token}`
    }
  }

  // Bit Goal
  // AJAX request to Streamlabs
  getBitGoalSettings() {
    // const host = this.hostsService.streamlabs;
    // const url = `https://${host}/api/v5/widget/bitgoal/settings`;
    // const bitGoalSettings = fetch(url);

    const response = {
      "settings":{
          "background_color":"#F9F9F9",
          "bar_color":"#46E65A",
          "bar_bg_color":"#DDDDDD",
          "text_color":"#FFFFFF",
          "bar_text_color":"#000000",
          "font":"Open Sans",
          "bar_thickness":"48",
          "custom_enabled":false,
          "custom_html":"",
          "custom_css":"",
          "custom_js":"",
          "layout":"standard"
      },
      "goal":{
          "title":"May Goal",
          "percent":0,
          "current_amount":0,
          "to_go":"93 days to go",
          "start":0,
          "amount":100
      },
      "widget":{
          "url":"https:\/\/streamlabs.com\/widgets\/bit-goal?token=52561F7EDC925D58480C"
      },
      "demo":{
          "title":"My Sample Goal",
          "percent":75,
          "current_amount":36,
          "to_go":"7 Days To Go",
          "start":0,
          "amount":48
      },
      "has_goal":true,
      "custom_defaults":{
          "html":"\n          <!-- All html objects will be wrapped in the #wrap div -->\n          <div class='goal-cont'>\n            <div id='title'><\/div>\n            <div id='goal-bar'>\n              <span id='goal-current'>0<\/span>\/<span id='goal-total'>0<\/span>\n            <\/div>\n            <div id='goal-end-date'>\n            <\/div>\n          <\/div>\n          ",
          "css":"\n          \/* All html objects will be wrapped in the #wrap div *\/\n          .goal-cont {\n          color: white;\n          background: black;\n        }",
          "js":"\n        \/\/ Events will be sent when someone followers\n        \/\/ Please use event listeners to run functions.\n        document.addEventListener('goalLoad', function(obj) {\n        \/\/ obj.detail will contain information about the current goal\n        \/\/ this will fire only once when the widget loads\n        console.log(obj.detail);\n        $('#title').html(obj.detail.title);\n        $('#goal-current').text(obj.detail.amount.current);\n        $('#goal-total').text(obj.detail.amount.target);\n        $('#goal-end-date').text(obj.detail.to_go.ends_at);\n        });\n        document.addEventListener('goalEvent', function(obj) {\n        \/\/ obj.detail will contain information about the goal\n        console.log(obj.detail);\n        $('#goal-current').text(obj.detail.amount.current);\n        });"
      },
      "platforms":{
          "twitch_account":"104340301"
      },
      "platforms2":{
          "twitch_account":"104340301",
          "facebook_account":"10155560531429874",
          "youtube_account":"UCWfSaiZstNd6B3tBVB9lY4Q",
          "periscope_account":"1YLEJOxoLnNQN",
          "mixer_account":"35742865"
      },
    };

    return response;
  }

  // Some defaults we will have to fetch from server to see if they exist
  // Here we check to see if user has custom code - if not they get default
  fetchBitGoalSettings(): IBitGoalSettings {
    const response = this.fetchFromServer();
    response.custom_html = response.custom_html || this.bitGoalDefaultHTML;
    response.custom_css = response.custom_css || this.bitGoalDefaultCSS;
    response.custom_js = response.custom_js || this.bitGoalDefaultJS;

    return response;
  }

  fetchFromServer(): IBitGoalSettings {
    return;
  }

  // For long default, we can set them as a variable, then call the variable in our defaults list
  bitGoalDefaultHTML = '<html></html>';
  bitGoalDefaultCSS = '.bit-goal{background: black};';
  bitGoalDefaultJS = '';

  defaultBitGoalSettings: IBitGoalSettings = {
    goal: {
      title: 'My Bit Goal',
    },
    settings: {},
    has_goal: false,
    widget: {},
    demo: {},
    show_bar: '',
    custom_defaults: {},
    custom_html: this.bitGoalDefaultHTML,
    custom_css: this.bitGoalDefaultCSS,
    custom_js: this.bitGoalDefaultJS,
    data: {
      title: 'My Bit Goal',
      goal_amount: 100,
      manual_goal_amount: 0,
      ends_at: '',
    }
  };

  donationGoalDefaultHTML = '<html></html>';
  donationGoalDefaultCSS = '.bit-goal{background: black};';
  donationGoalDefaultJS = '';

  defaultDonationGoalSettings: IDonationGoalSettings = {
    donationGoalSettings: {},
    goal: {
      title: 'Donation Goal Title'
    },
    widget: {},
    has_goal: false,
    demo: {},
    show_bar: '',
    custom_defaults: {},
    custom_html: this.donationGoalDefaultHTML,
    custom_css: this.donationGoalDefaultCSS,
    custom_js: this.donationGoalDefaultJS
  };
}
