import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import ObsListInput from 'components/obs/inputs/ObsListInput.vue';
import { ISourceApi } from 'services/sources';
import { IObsListInput } from 'components/obs/inputs/ObsInput';
import { WidgetDefinitions, IWidget, WidgetType } from 'services/widgets';
import { NavigationService } from 'services/navigation';
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

  widgetModel: IObsListInput<string> = null;

  get isLoggedIn() {
    return this.userService.isLoggedIn();
  }

  created() {
    this.refreshWidgetModel();
  }

  handleInput(value: IObsListInput<string>) {
    this.source.setPropertiesManagerSettings({
      widgetType: value.value
    });
    this.refreshWidgetModel();
    this.$emit('update');
  }

  refreshWidgetModel() {
    const value = this.source
      .getPropertiesManagerSettings()
      .widgetType.toString();

    this.widgetModel = {
      value,
      description: $t('Widget Type'),
      name: 'widgetType',
      options: Object.keys(WidgetDefinitions).map(type => {
        const widget = WidgetDefinitions[type] as IWidget;

        return {
          description: widget.name,
          value: type
        };
      })
    };
  }

  login() {
    this.windowsService.closeChildWindow();
    this.userService.showLogin();
  }

  navigateDashboard() {
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
    }[this.widgetModel.value];

    this.navigationService.navigate('Dashboard', { subPage });
    this.windowsService.closeChildWindow();
  }
}
