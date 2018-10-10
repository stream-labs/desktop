import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import ObsListInput from 'components/obs/inputs/ObsListInput.vue';
import { ISourceApi } from 'services/sources';
import { IObsListInput } from 'components/obs/inputs/ObsInput';
import { WidgetDefinitions, IWidget, WidgetType } from 'services/widgets';
import { NavigationService } from 'services/navigation';
import { ChatbotApiService } from 'services/chatbot';
import { WindowsService } from 'services/windows';
import { Inject } from 'util/injector';
import { $t } from 'services/i18n';
import { UserService } from 'services/user';

@Component({
  components: {
    ObsListInput
  }
})
export default class WidgetProperties extends Vue {
  @Prop() source: ISourceApi;

  @Inject() navigationService: NavigationService;
  @Inject() windowsService: WindowsService;
  @Inject() userService: UserService;
  @Inject() chatbotApiChatbotApiService: ChatbotApiService;

  widgetModel: IObsListInput<string> = null;

  get isLoggedIn() {
    return this.userService.isLoggedIn();
  }

  login() {
    this.windowsService.closeChildWindow();
    this.userService.showLogin();
  }

  navigateWidgetSettings() {

    const widgetType = this.source
      .getPropertiesManagerSettings()
      .widgetType;

    if (widgetType === WidgetType.Chatbot) {
      // chatbot widget doesnt exist on sl.com, but its own chatbot tab
      this.navigationService.navigate('Chatbot');
      this.chatbotApiChatbotApiService.Common.openSongRequestPreferencesWindow();
      return;
    }

    const subPage = {
      [WidgetType.AlertBox]: 'alertbox',
      [WidgetType.DonationGoal]: 'donationgoal',
      [WidgetType.FollowerGoal]: 'followergoal',
      [WidgetType.SubscriberGoal]: 'followergoal',
      [WidgetType.BitGoal]: 'bitgoal',
      [WidgetType.DonationTicker]: 'donationticker',
      [WidgetType.ChatBox]: 'chatbox',
      [WidgetType.EventList]: 'eventlist',
      [WidgetType.TipJar]: 'jar',
      [WidgetType.ViewerCount]: 'viewercount',
      [WidgetType.StreamBoss]: 'streamboss',
      [WidgetType.Credits]: 'credits',
      [WidgetType.SpinWheel]: 'wheel'
    }[widgetType.toString()];

    this.navigationService.navigate('Dashboard', { subPage });
    this.windowsService.closeChildWindow();
  }
}
