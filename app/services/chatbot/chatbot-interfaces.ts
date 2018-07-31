// state
export interface IChatbotApiServiceState {
  api_token: string;
  socket_token: string;
  default_commands_response: IDafaultCommandsResponse;
  custom_commands_response: ICustomCommandsResponse;
  timers_response: ITimersResponse;
  command_variables_response: ICommandVariablesResponse;
  chat_alerts_response: IChatAlertsResponse;
}

// responses
export interface IChatbotAPIPostResponse {
  success: boolean;
}

export interface IChatbotAPIPutResponse {
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
  [id: number] : ICommandVariables;
}

export interface ITimersResponse {
  pagination: IPagination;
  data: ITimersData;
}

export interface IChatAlertsResponse {
  settings: IChatAlertsData;
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

// default commands
export interface IDefaultCommand {
  command: string;
  description: string;
  aliases: IAliases;
  response_type: string;
  success_response?: string;
  failed_response?: string;
  response?: string;
  static_permission?: IPermission;
  permission?: IPermission;
  enabled?: boolean;
  enabled_response?: string;
  disabled_response?: string;
}

export interface IDafaultCommandsSlug {
  [id: string]: IDefaultCommand;
}

// custom commands
export interface ICustomCommandsData {
  [id: number]: ICustomCommand;
}


export interface ICustomCommandRow {
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
export interface ICommandVariables {
  [id: string]: any
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
  enabled: boolean;
  onToggleEnabled: Function;
  onExpand: Function;
}

// chat alerts
export interface IChatAlertsData {
  streamlabs: IStreamlabsChatAlert;
  twitch: ITwitchChatAlert;
  youtube: IYoutubeChatAlert;
  mixer: IMixerChatAlert;
}

export interface IStreamlabsChatAlert extends ITipAlert {}

export interface ITwitchChatAlert
  extends IFollowAlert, IHostAlert, ISubAlert, IRaidAlert {}

export interface IYoutubeChatAlert
  extends IYTSubAlert, ISponsorAlert, ISuperchatAlert {}

export interface IMixerChatAlert
  extends IFollowAlert, IHostAlert, ISubAlert {}


  // tips
export interface ITipAlert {
  use_tip: boolean;
  tip_messages: ITipMessage[];
}

export interface ITipMessage {
  amount: number;
  message: string;
}

// followers
export interface IFollowAlert {
  use_follow: boolean;
  follow_messages: string[];
}

// hosts
export interface IHostAlert {
  use_host: boolean;
  host_messages: IHostMessage[];
}

export interface IHostMessage {
  min_viewers: number;
  message: string;
}

// subscribers
export interface ISubAlert {
  use_sub: boolean;
  subscriber_messages: {
    [id: string]: ISubAlertMessage[];
  };
}

export interface ISubAlertMessage {
  months: number;
  message: string;
  is_gifted?: boolean;
}

// raids
export interface IRaidAlert {
  use_raid: boolean;
  raid_messages: IRaidMessage[];
}

export interface IRaidMessage {
  amount: number;
  message: string;
}

// youtube subscribers
export interface IYTSubAlert {
  use_sub: boolean;
  subscriber_messages: string[];
}

// sponsors
export interface ISponsorAlert {
  use_sponsor: boolean;
  sponsor_messsages: ISponsorMessage[];
}

export interface ISponsorMessage {
  months: number;
  message: string;
}

// superchat
export interface ISuperchatAlert {
  use_superchat: boolean;
  superchat_messages: ISuperchatMessage[];
}

export interface ISuperchatMessage {
  amount: number;
  message: string;
}


// dictionaries
export enum ChatbotPermissions {
  None = 0,
  Viewer = 1,
  Subscriber = 1 << 1,
  Moderator = 1 << 5,
  Broadcaster = 1 << 7,
  All = Viewer | Subscriber | Moderator | Broadcaster
}

export enum ChatbotResponseTypes {
  Chat = 'Chat',
  Whisper = 'Whisper'
}