import Vue from 'vue';
import URI from 'urijs';
import { defer } from 'lodash';
import { PersistentStatefulService } from '../../services/persistent-stateful-service';
import { Inject } from '../../util/injector';
import { handleErrors, authorizedHeaders } from 'util/requests';
import { mutation } from '../../services/stateful-service';
import electron from 'electron';
import { HostsService } from '../../services/hosts';
import {
  getPlatformService,
  IPlatformAuth,
  TPlatform,
  IPlatformService
} from '../../services/platforms';
import { CustomizationService } from '../../services/customization';
import Raven from 'raven-js';
import { AppService } from 'services/app';
import { SceneCollectionsService } from 'services/scene-collections';
import { Subject } from 'rxjs/Subject';
import Util from 'services/utils';
import { Component } from 'vue-property-decorator';
import ModalLayout from 'components/ModalLayout.vue';
import FontInput from '../shared/forms/FontInput.vue';
import ColorInput from '../shared/forms/ColorInput.vue';

@Component({
  components: {
    FontInput,
    ColorInput,
    ModalLayout
  }
})
export default class BitGoal extends Vue {
  @Inject() hostsService: HostsService;
  @Inject() customizationService: CustomizationService;
  @Inject() appService: AppService;
  @Inject() sceneCollectionsService: SceneCollectionsService;

  mounted() {
    this.getSettings();
  }

  getSettings() {
    // const host = this.hostsService.streamlabs;
    // const url = `https://${host}/api/v5/widget/bitgoal/settings`;
    // settings = fetch(url);

    var response = {"settings":{"background_color":"#F9F9F9","bar_color":"#46E65A","bar_bg_color":"#DDDDDD","text_color":"#FFFFFF","bar_text_color":"#000000","font":"Open Sans","bar_thickness":"48","custom_enabled":false,"custom_html":"","custom_css":"","custom_js":"","layout":"standard"}, goal:<string[]> [],"widget":{"url":"https:\/\/streamlabs.com\/widgets\/bit-goal?token=52561F7EDC925D58480C"},"demo":{"title":"My Sample Goal","percent":75,"current_amount":36,"to_go":"7 Days To Go","start":0,"amount":48},"has_goal":true,"custom_defaults":{"html":"\n          <!-- All html objects will be wrapped in the #wrap div -->\n          <div class='goal-cont'>\n            <div id='title'><\/div>\n            <div id='goal-bar'>\n              <span id='goal-current'>0<\/span>\/<span id='goal-total'>0<\/span>\n            <\/div>\n            <div id='goal-end-date'>\n            <\/div>\n          <\/div>\n          ","css":"\n          \/* All html objects will be wrapped in the #wrap div *\/\n          .goal-cont {\n          color: white;\n          background: black;\n        }","js":"\n        \/\/ Events will be sent when someone followers\n        \/\/ Please use event listeners to run functions.\n        document.addEventListener('goalLoad', function(obj) {\n        \/\/ obj.detail will contain information about the current goal\n        \/\/ this will fire only once when the widget loads\n        console.log(obj.detail);\n        $('#title').html(obj.detail.title);\n        $('#goal-current').text(obj.detail.amount.current);\n        $('#goal-total').text(obj.detail.amount.target);\n        $('#goal-end-date').text(obj.detail.to_go.ends_at);\n        });\n        document.addEventListener('goalEvent', function(obj) {\n        \/\/ obj.detail will contain information about the goal\n        console.log(obj.detail);\n        $('#goal-current').text(obj.detail.amount.current);\n        });"},"platforms":{"twitch_account":"104340301"},"platforms2":{"twitch_account":"104340301","facebook_account":"10155560531429874","youtube_account":"UCWfSaiZstNd6B3tBVB9lY4Q","periscope_account":"1YLEJOxoLnNQN","mixer_account":"31605237"},"thirdpartyplatforms":{"tiltify":{"id":11,"user_id":16709,"tiltify_id":28396,campaign_id:<string> null,"name":"Streamlabs","email":"devteam@streamlabs.com","access_token":"d75ecee3813b0798f7ad772b22057021ae6e5b5edc3cd54646c24cc7d1899c0b","created_at":"2017-12-01 21:03:03","updated_at":"2017-12-01 21:03:03"},"tipeeestream":{"id":3,"user_id":16709,"tipeeestream_id":321179,"name":"morganleee","access_token":"Y2I0MDJiYzAyZGEzMmM2OGZlMGVmMzE5NWE1NzQ4YjRmNDliOTE0ZmYwNjkxM2E0NTI2YjY0YzhiZGY2OWYxMA","refresh_token":"OTkyOGRkNDY0ZmQ0OTBlOTJmMjQ1YmVhM2I1OGQyZWJhZTM4ODg4OGFhMThmZDlkMGNjYWY0NjQ4YmI1NmJjNQ","created_at":"2018-02-06 22:59:42","updated_at":"2018-02-06 22:59:42"}}}

    this.settings = response.settings;
    this.goal = response.goal;
    this.has_goal = response.has_goal;
  }


  // Comes from the data object on Streamlabs
  // This is data that IS NOT included in the returned settings
  // Where we define defaults
  settings: object = {};
  goal: string[] = [];
  has_goal: boolean = false;
  campaign_id:string;
  data: object = {
    title: <string> '',
    goal_amount: <number> null,
    manual_goal_amount: <number> null,
    ends_at: <string> '',
  };


  // Will be function to save settings and close window
  submit() {

  }

  // Will be function to close window
  cancel() {

  }
}
