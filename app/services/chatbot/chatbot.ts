import { Service } from '../service';
import { Inject } from '../../util/injector';

// modules
import {
  ChatbotAlertsApiService,
  ChatbotCommandsApiService,
  ChatbotTimerApiService,
  ChatbotModToolsApiService,
  ChatbotQueueApiService,
  ChatbotQuotesApiService,
  ChatbotSongRequestApiService,
  ChatbotBaseApiService,
  ChatbotCommonService,
  ChatbotLoyaltyApiService,
  ChatbotHeistApiService
} from './index';

export class ChatbotApiService extends Service {
  @Inject('ChatbotBaseApiService') Base: ChatbotBaseApiService;
  @Inject('ChatbotCommonService') Common: ChatbotCommonService;
  @Inject('ChatbotAlertsApiService') Alerts: ChatbotAlertsApiService;
  @Inject('ChatbotCommandsApiService') Commands: ChatbotCommandsApiService;
  @Inject('ChatbotTimerApiService') Timers: ChatbotTimerApiService;
  @Inject('ChatbotModToolsApiService') ModTools: ChatbotModToolsApiService;
  @Inject('ChatbotQueueApiService') Queue: ChatbotQueueApiService;
  @Inject('ChatbotQuotesApiService') Quotes: ChatbotQuotesApiService;
  @Inject('ChatbotSongRequestApiService') SongRequest: ChatbotSongRequestApiService;
  @Inject('ChatbotLoyaltyApiService') Loyalty: ChatbotLoyaltyApiService;
  @Inject('ChatbotHeistApiService') Heist: ChatbotHeistApiService;
}
