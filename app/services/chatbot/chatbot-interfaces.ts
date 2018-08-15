
// state
export interface IChatbotApiServiceState {
  apiToken: string;
  socketToken: string;
  globallyEnabled: boolean;
  defaultCommandsResponse: IDafaultCommandsResponse;
  customCommandsResponse: ICustomCommandsResponse;
  timersResponse: ITimersResponse;
  commandVariablesResponse: ICommandVariablesResponse;
  chatAlertsResponse: IChatAlertsResponse;
  capsProtectionResponse: ICapsProtectionResponse;
  symbolProtectionResponse: ISymbolProtectionResponse;
  linkProtectionResponse: ILinkProtectionResponse;
  wordProtectionResponse: IWordProtectionResponse;
}

export interface IChatbotCommonServiceState {
  toasted: any;
  customCommandToUpdate: ICustomCommand;
  defaultCommandToUpdate: IDefaultCommand;
  timerToUpdate: ITimer;
  modBannerVisible: boolean;
}

// responses
export interface IChatbotAuthResponse {
  api_token: string;
  socket_token: string;
}

export interface IChatbotStatusResponse {
  worker: IChatbotWorkerStatus;
  clients: IChatbotClientsStatus;
}

export interface IChatbotAPIPostResponse {
  success: boolean;
}

export interface IChatbotAPIPutResponse {
  success: boolean;
}

export interface IChatbotAPIDeleteResponse {
  success: boolean;
}


export interface IDafaultCommandsResponse {
  commands: IDafaultCommandsSlug;
  'link-protection': IDafaultCommandsSlug;
  giveaway: IDafaultCommandsSlug;
}

export interface ICustomCommandsResponse {
  pagination: IPagination;
  data: ICustomCommandsData;
}

export interface ICommandVariablesResponse {
  [id: number] : ICommandVariable;
}

export interface ITimersResponse {
  pagination: IPagination;
  data: ITimersData;
}

export interface IChatAlertsResponse {
  settings: IChatAlertsData;
  enabled: boolean;
}

export interface ICapsProtectionResponse {
  settings: ICapsProtectionData;
  enabled: boolean;
}

export interface ISymbolProtectionResponse {
  settings: ISymbolProtectionData;
  enabled: boolean;
}

export interface ILinkProtectionResponse {
  settings: ILinkProtectionData;
  enabled: boolean;
}

export interface IWordProtectionResponse {
  settings: IWordProtectionData;
  enabled: boolean;
}


// shared
export interface IPermission {
  level: number;
  info?: IPermissionInfo;
}

export interface IPermissionInfo {
  [id: string]: any;
}

export interface ICooldown {
  global: number;
  user: number;
}

export interface IAliases {
  [id: number]: string;
}

export interface IPagination {
  current: number;
  total: number;
}

export interface IPunishment {
  duration: number;
  type: string;
}


export interface IExcluded extends IPermission {}


// status
export interface IChatbotWorkerStatus {
  status: string;
  type: string;
}
export interface IChatbotClientsStatus {
  status: string;
  services: string[];
}

// default commands
export interface IDefaultCommand {
  command: string;
  description: string;
  aliases: IAliases;
  response_type?: string;
  success_response?: string;
  failed_response?: string;
  response?: string;
  static_permission?: IPermission;
  permission?: IPermission;
  enabled?: boolean;
  enabled_response?: string;
  disabled_response?: string;
  slugName?: string;
  commandName?: string;
}

export interface IDafaultCommandsSlug {
  [id: string]: IDefaultCommand;
}

// custom commands
export interface ICustomCommandsData {
  [id: number]: ICustomCommand;
}

export interface ICustomCommand {
  id?: string;
  user_id?: number;
  command: string;
  permission: IPermission;
  response: string;
  response_type?: string;
  cooldowns: ICooldown;
  aliases: IAliases;
  platforms: number;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

// command variables
export interface ICommandVariable {
  variable: string;
  description: string;
  example: string;
  result: string;
  tags: string[];
}

// timers
export interface ITimersData {
  [id: number]: ITimer;
}

export interface ITimer {
  id?: string;
  user_id?: number;
  name: string;
  interval: number;
  chat_lines: number;
  message: string;
  platforms: number;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

// modules
export interface IChatbotModule {
  title: string;
  description: string;
  backgroundUrl: string;
  enabled: boolean;
  onToggleEnabled: Function;
  onExpand: Function;
}

// chat alerts
export interface IChatAlertsData {
  [id: string]: {
    [id: string]: IAlertType;
  }
}

export interface IAlertType {
  enabled: boolean;
  messages: IAlertMessage[];
}

export interface IAlertMessage {
  message: string;
  amount?: number;
  is_gifted?: boolean;
  tier?: string;
}

// protections
export interface IProtectionGeneral {
  punishment?: IPunishment;
  excluded: IExcluded;
  message: string;
}

export interface IProtectionAdvanced {
  minimum?: number;
  maximum?: number;
  percent?: number;
}

export interface IProtectionList<type> {
  [id: number]: type;
}


// caps protection data
export interface ICapsProtectionData {
  general: IProtectionGeneral;
  advanced: IProtectionAdvanced;
}

// symbol protection data
export interface ISymbolProtectionData {
  general: IProtectionGeneral;
  advanced: IProtectionAdvanced;
}
// link protection data
export interface ILinkProtectionData {
  commands: ILinkProtectionCommands;
  general: IProtectionGeneral;
  whitelist: IProtectionList<string>;
  blacklist: IProtectionList<string>;
}

export interface ILinkProtectionCommands {
  [id: string]: ILinkProtectionCommand;
}

export interface ILinkProtectionCommand {
  command: string;
  description: string;
  response: string;
  response_type: string;
  aliases: IAliases;
}

// words protection data
export interface IWordProtectionData {
  general: IProtectionGeneral;
  blacklist: IProtectionList<IWordProtectionBlackListItem>;
}

export interface IWordProtectionBlackListItem {
  text: string;
  is_regex: boolean;
  punishment: IPunishment;
}

// dictionaries
export enum ChatbotAutopermitEnums {
  'None' = 0,
  'Everyone' = 1,
  'Subscriber Only' = 1 << 1,
}

export enum ChatbotPermissionsEnums {
  'None' = 0,
  'Everyone' = 1,
  'Subscriber Only' = 1 << 1,
  'Moderator Only' = 1 << 5,
  'Streamer Only' = 1 << 7,
  'Subscribers & Moderators Only' = (1 << 1) | (1 << 5)
}


export enum ChatbotPunishments {
  Purge = 'Purge',
  Timeout = 'Timeout',
  Ban = 'Ban'
}

export enum ChatbotResponseTypes {
  Chat = 'Chat',
  Whisper = 'Whisper'
}

export type ChatbotAlertTypes = 'tip' | 'follow' | 'host' | 'raid' | 'sub' | 'bits';

export const ChatbotClients = [
  'Twitch'
]

export type ChatbotSettingSlugs = 'caps-protection' | 'symbol-protection' | 'link-protection' | 'words-protection'


// modals (inside child window)
export const NEW_ALERT_MODAL_ID = 'new-alert';
export const NEW_LINK_PROTECTION_LIST_MODAL_ID = 'new-link-protection-list';
export const NEW_WORD_PROTECTION_LIST_MODAL_ID = 'new-word-protection-list';