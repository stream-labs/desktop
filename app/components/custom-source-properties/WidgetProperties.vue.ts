import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import ListInput from 'components/shared/forms/ListInput.vue';
import { ISourceApi } from 'services/sources';
import { IListInput } from 'components/shared/forms/Input';
import { WidgetDefinitions, IWidget, WidgetType } from 'services/widgets';
import { NavigationService } from 'services/navigation';
import { WindowsService } from 'services/windows';
import { Inject } from 'util/injector';

@Component({
  components: {
    ListInput
  }
})
export default class WidgetProperties extends Vue {
  @Prop() source: ISourceApi;

  @Inject() navigationService: NavigationService;
  @Inject() windowsService: WindowsService;

  widgetModel: IListInput<string> = null;

  created() {
    this.refreshWidgetModel();
  }

  handleInput(value: IListInput<string>) {
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
      description: 'Widget Type',
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
      [WidgetType.TheJar]: 'jar',
      [WidgetType.ViewerCount]: 'viewercount',
      [WidgetType.StreamBoss]: 'streamboss',
      [WidgetType.Credits]: 'credits',
      [WidgetType.SpinWheel]: 'wheel'
    }[this.widgetModel.value];

    this.navigationService.navigate('Dashboard', { subPage });
    this.windowsService.closeChildWindow();
  }
}
