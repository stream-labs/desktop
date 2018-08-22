import {
  IChatbotApiServiceState,
  IChatbotCommonServiceState,
  ICustomCommand,
  IDefaultCommand,
  IChatbotTimer,
  IChatAlertsResponse,
  ICapsProtectionResponse,
  ISymbolProtectionResponse,
  ILinkProtectionResponse,
  IWordProtectionResponse,
  ChatbotSettingSlugs
} from './index';

export interface IChatbotServerApi {
  // state + auth
  state: IChatbotApiServiceState;
  logIn(): Promise<any | void>;
  logOut(): void;

  // get
  fetchChatbotGlobalEnabled(): Promise<any | void>;
  fetchCustomCommands(page: number, query: string): Promise<any | void>;
  fetchDefaultCommands(): Promise<any | void>;
  fetchCommandVariables(): Promise<any | void>;
  fetchTimers(page: number, query: string): Promise<any | void>;
  fetchChatAlerts(): Promise<any | void>;
  fetchCapsProtection(): Promise<any | void>;
  fetchSymbolProtection(): Promise<any | void>;
  fetchLinkProtection(): Promise<any | void>;
  fetchWordProtection(): Promise<any | void>;

  // post /put
  resetSettings(
    slug: ChatbotSettingSlugs
  ): Promise<
  | IChatAlertsResponse
  | ICapsProtectionResponse
  | ISymbolProtectionResponse
  | ILinkProtectionResponse
  | IWordProtectionResponse
  >;
  toggleEnableChatbot(): Promise<any | void>;
  joinPlatformChannel(platform: string): Promise<any | void>;
  leavePlatformChannel(platform: string): Promise<any | void>;
  resetDefaultCommands(): Promise<any | void>;
  resetDefaultCommand(
    slugName: string,
    commandName: string
  ): Promise<any | void>;
  createCustomCommand(data: ICustomCommand): Promise<any | void>;
  createTimer(data: IChatbotTimer): Promise<any | void>;
  updateDefaultCommand(
    slugName: string,
    commandName: string,
    data: IDefaultCommand
  ): Promise<any | void>;
  updateCustomCommand(id: string, data: ICustomCommand): Promise<any | void>;
  updateTimer(id: string, data: IChatbotTimer): Promise<any | void>;
  updateChatAlerts(data: IChatAlertsResponse): Promise<any | void>;
  updateCapsProtection(data: ICapsProtectionResponse): Promise<any | void>;
  updateSymbolProtection(
    data: ISymbolProtectionResponse
  ): Promise<any | void>;
  updateLinkProtection(data: ILinkProtectionResponse): Promise<any | void>;
  updateWordProtection(data: IWordProtectionResponse): Promise<any | void>;

  // delete
  deleteCustomCommand(id: string): Promise<any | void>;
  deleteTimer(id: string): Promise<any | void>;
}

export interface IChatbotCommonApi {
  state: IChatbotCommonServiceState;
  windowsService: any;
  hideModBanner(): void;
  showModBanner(): void;
  closeChildWindow(): void;
  openCustomCommandWindow(command?: ICustomCommand): void;
  openDefaultCommandWindow(command: IDefaultCommand): void;
  openTimerWindow(timer?: IChatbotTimer): void;
  openChatbotAlertsWindow(): void;
  openCapsProtectionWindow(): void;
  openSymbolProtectionWindow(): void;
  openLinkProtectionWindow(): void;
  openWordProtectionWindow(): void;
}
