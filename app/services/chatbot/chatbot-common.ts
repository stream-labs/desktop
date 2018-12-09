import Vue from 'vue';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { Inject } from 'util/injector';
import { mutation } from '../stateful-service';
import { WindowsService } from 'services/windows';
import { $t } from 'services/i18n';
import {
  IChatbotCommonServiceState,
  ICustomCommand,
  IDefaultCommand,
  IChatbotTimer,
  IQuote,
  IChatbotLoyalty
} from './chatbot-interfaces';

export class ChatbotCommonService extends PersistentStatefulService<
  IChatbotCommonServiceState
> {
  @Inject() windowsService: WindowsService;

  static defaultState: IChatbotCommonServiceState = {
    toasted: null,
    customCommandToUpdate: null,
    defaultCommandToUpdate: null,
    timerToUpdate: null,
    quoteToUpdate: null,
    modBannerVisible: true,
    loyaltyToUpdate: null
  };

  hideModBanner() {
    this.HIDE_MOD_BANNER();
  }

  showModBanner() {
    this.SHOW_MOD_BANNER();
  }

  closeChildWindow() {
    this.windowsService.closeChildWindow();
  }

  closeChatbotChildWindow() {
    const options = this.windowsService.getChildWindowOptions();
    const name = options ? options.componentName : '';
    
    if(name.includes('Chatbot')){
      this.windowsService.closeChildWindow();
    }
  }

  openCustomCommandWindow(command?: ICustomCommand) {
    if (command) {
      this.SET_CUSTOM_COMAND_TO_UPDATE(command);
    }
    this.windowsService.showWindow({
      componentName: 'ChatbotCustomCommandWindow',
      title: $t('Chatbot Custom Command Window'),
      size: {
        width: 650,
        height: 600
      }
    });
  }

  openDefaultCommandWindow(command: IDefaultCommand) {
    if (command) {
      this.SET_DEFAULT_COMAND_TO_UPDATE(command);
    }
    this.windowsService.showWindow({
      componentName: 'ChatbotDefaultCommandWindow',
      title: $t('Chatbot Default Commmand Window'),
      size: {
        width: 650,
        height: 650
      }
    });
  }

  openTimerWindow(timer?: IChatbotTimer) {
    if (timer) {
      this.SET_TIMER_TO_UPDATE(timer);
    }
    this.windowsService.showWindow({
      componentName: 'ChatbotTimerWindow',
      title: $t('Chatbot Timer Window'),
      size: {
        width: 650,
        height: 500
      }
    });
  }

  openChatbotAlertsWindow() {
    this.windowsService.showWindow({
      componentName: 'ChatbotAlertsWindow',
      title: $t('Chatbot Alerts Preferences'),
      size: {
        width: 1000,
        height: 700
      }
    });
  }

  openCapsProtectionWindow() {
    this.windowsService.showWindow({
      componentName: 'ChatbotCapsProtectionWindow',
      title: $t('Chatbot Caps Protection Preferences'),
      size: {
        width: 650,
        height: 500
      }
    });
  }

  openSymbolProtectionWindow() {
    this.windowsService.showWindow({
      componentName: 'ChatbotSymbolProtectionWindow',
      title: $t('Chatbot Symbol Protection Preferences'),
      size: {
        width: 650,
        height: 500
      }
    });
  }

  openLinkProtectionWindow() {
    this.windowsService.showWindow({
      componentName: 'ChatbotLinkProtectionWindow',
      title: $t('Chatbot Link Protection Preferences'),
      size: {
        width: 650,
        height: 650
      }
    });
  }

  openWordProtectionWindow() {
    this.windowsService.showWindow({
      componentName: 'ChatbotWordProtectionWindow',
      title: $t('Chatbot Word Protection Preferences'),
      size: {
        width: 650,
        height: 500
      }
    });
  }

  openQuoteWindow(quote?: IQuote) {
    if (quote) {
      this.SET_QUOTE_TO_UPDATE(quote);
    }
    this.windowsService.showWindow({
      componentName: 'ChatbotQuoteWindow',
      title: $t('Chatbot Quote Window'),
      size: {
        width: 650,
        height: 500
      }
    });
  }

  openLoyaltyWindow(loyalty?: IChatbotLoyalty) {
    if (loyalty) {
      this.SET_LOYALTY_TO_UPDATE(loyalty);
    }
    this.windowsService.showWindow({
      componentName: 'ChatbotLoyaltyWindow',
      title: $t('Chatbot Loyalty Window'),
      size: {
        width: 475,
        height: 229
      }
    });
  }

  openLoyaltyAddAllWindow() {
    this.windowsService.showWindow({
      componentName: 'ChatbotLoyaltyAddAllWindow',
      title: $t('Chatbot Add Loyalty'),
      size: {
        width: 475,
        height: 192
      }
    });
  }

  openLoyaltyPreferencesWindow() {
    this.windowsService.showWindow({
      componentName: 'ChatbotLoyaltyPreferencesWindow',
      title: $t('Chatbot Loyalty Preferences'),
      size: {
        width: 650,
        height: 580
      }
    });
  }

  openQueuePreferencesWindow() {
    this.windowsService.showWindow({
      componentName: 'ChatbotQueuePreferencesWindow',
      title: $t('Chatbot Queue Preferences'),
      size: {
        width: 650,
        height: 500
      }
    });
  }

  openQuotePreferencesWindow() {
    this.windowsService.showWindow({
      componentName: 'ChatbotQuotePreferencesWindow',
      title: $t('Chatbot Quote Preferences'),
      size: {
        width: 650,
        height: 300
      }
    });
  }

  openSongRequestPreferencesWindow() {
    this.windowsService.showWindow({
      componentName: 'ChatbotSongRequestPreferencesWindow',
      title: $t('Chatbot Song Request Preferences'),
      size: {
        width: 650,
        height: 500
      }
    });
  }

  openHeistPreferencesWindow() {
    this.windowsService.showWindow({
      componentName: 'ChatbotHeistPreferencesWindow',
      title: $t('Chatbot Heist Preferences'),
      size: {
        width: 650,
        height: 600
      }
    });
  }

  openSongRequestOnboardingWindow() {
    this.windowsService.showWindow({
      componentName: 'ChatbotSongRequestOnboardingWindow',
      title: $t('Enabling Song Request'),
      size: {
        width: 750,
        height: 550
      }
    });
  }

  @mutation()
  private HIDE_MOD_BANNER() {
    Vue.set(this.state, 'modBannerVisible', false);
  }

  @mutation()
  private SHOW_MOD_BANNER() {
    Vue.set(this.state, 'modBannerVisible', true);
  }

  @mutation()
  private SET_CUSTOM_COMAND_TO_UPDATE(command: ICustomCommand) {
    Vue.set(this.state, 'customCommandToUpdate', command);
  }

  @mutation()
  private SET_DEFAULT_COMAND_TO_UPDATE(command: IDefaultCommand) {
    Vue.set(this.state, 'defaultCommandToUpdate', command);
  }

  @mutation()
  private SET_TIMER_TO_UPDATE(timer: IChatbotTimer) {
    Vue.set(this.state, 'timerToUpdate', timer);
  }

  @mutation()
  private SET_QUOTE_TO_UPDATE(quote: IQuote) {
    Vue.set(this.state, 'quoteToUpdate', quote);
  }

  @mutation()
  private SET_LOYALTY_TO_UPDATE(loyalty: IChatbotLoyalty) {
    Vue.set(this.state, 'loyaltyToUpdate', loyalty);
  }
}
