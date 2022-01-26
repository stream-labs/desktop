import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { ISourceApi } from 'services/sources';
import { WidgetType } from 'services/widgets';
import { NavigationService } from 'services/navigation';
import { WindowsService } from 'services/windows';
import { Inject } from 'services/core/injector';
import { UserService } from 'services/user';
import { MagicLinkService } from 'services/magic-link';
import * as remote from '@electron/remote';

@Component({})
export default class WidgetProperties extends Vue {
  @Prop() source: ISourceApi;

  @Inject() navigationService: NavigationService;
  @Inject() windowsService: WindowsService;
  @Inject() userService: UserService;
  @Inject() magicLinkService: MagicLinkService;

  get isLoggedIn() {
    return this.userService.isLoggedIn;
  }

  login() {
    this.windowsService.closeChildWindow();
    this.userService.showLogin();
  }

  disabled = false;

  async navigateWidgetSettings() {
    const widgetType = this.source.getPropertiesManagerSettings().widgetType;

    const subPage = {
      [WidgetType.AlertBox]: 'alertbox',
      [WidgetType.DonationGoal]: 'donationgoal',
      [WidgetType.FollowerGoal]: 'followergoal',
      [WidgetType.SubscriberGoal]: 'followergoal',
      [WidgetType.BitGoal]: 'bitgoal',
      [WidgetType.StarsGoal]: 'starsgoal',
      [WidgetType.SupporterGoal]: 'supportergoal',
      [WidgetType.DonationTicker]: 'donationticker',
      [WidgetType.ChatBox]: 'chatbox',
      [WidgetType.EventList]: 'eventlist',
      [WidgetType.TipJar]: 'jar',
      [WidgetType.ViewerCount]: 'viewercount',
      [WidgetType.StreamBoss]: 'streamboss',
      [WidgetType.Credits]: 'credits',
      [WidgetType.SpinWheel]: 'wheel',
    }[widgetType.toString()];

    this.disabled = true;

    try {
      const link = await this.magicLinkService.getDashboardMagicLink(subPage);
      remote.shell.openExternal(link);
    } catch (e: unknown) {
      console.error('Error generating dashboard magic link', e);
    }

    this.windowsService.closeChildWindow();
  }
}
