import { Service } from '../core/service';
import { Inject } from '../core/injector';

// modules
import {
  ChatbotAlertsApiService,
  ChatbotCommandsApiService,
  ChatbotTimerApiService,
  ChatbotModToolsApiService,
  ChatbotQueueApiService,
  ChatbotQuotesApiService,
  ChatbotMediaRequestApiService,
  ChatbotBaseApiService,
  ChatbotCommonService,
  ChatbotLoyaltyApiService,
  ChatbotHeistApiService,
  ChatbotPollApiService,
  ChatbotBettingApiService,
  ChatbotImporterApiService,
  ChatbotUserManagementApiService,
} from './index';
import { ChatbotGambleApiService } from './chatbot-gamble';

export class ChatbotApiService extends Service {
  @Inject('ChatbotBaseApiService') Base: ChatbotBaseApiService;
  @Inject('ChatbotCommonService') Common: ChatbotCommonService;
  @Inject('ChatbotAlertsApiService') Alerts: ChatbotAlertsApiService;
  @Inject('ChatbotCommandsApiService') Commands: ChatbotCommandsApiService;
  @Inject('ChatbotTimerApiService') Timers: ChatbotTimerApiService;
  @Inject('ChatbotModToolsApiService') ModTools: ChatbotModToolsApiService;
  @Inject('ChatbotQueueApiService') Queue: ChatbotQueueApiService;
  @Inject('ChatbotQuotesApiService') Quotes: ChatbotQuotesApiService;
  @Inject('ChatbotMediaRequestApiService') MediaRequest: ChatbotMediaRequestApiService;
  @Inject('ChatbotLoyaltyApiService') Loyalty: ChatbotLoyaltyApiService;
  @Inject('ChatbotHeistApiService') Heist: ChatbotHeistApiService;
  @Inject('ChatbotPollApiService') Poll: ChatbotPollApiService;
  @Inject('ChatbotBettingApiService') Betting: ChatbotBettingApiService;
  @Inject('ChatbotImporterApiService') Importer: ChatbotImporterApiService;
  @Inject('ChatbotGambleApiService') Gamble: ChatbotGambleApiService;
  @Inject('ChatbotUserManagementApiService') UserManagement: ChatbotUserManagementApiService;
}
