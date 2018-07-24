// state
export interface ChatbotApiServiceState {
  api_token: string;
  socket_token: string;
  default_commands_response: DafaultCommandsResponse;
  custom_commands_response: CustomCommandsResponse;
  timers_response: TimersResponse;
  command_variables_response: CommandVariablesResponse;
  chat_alerts_response: ChatAlertsResponse;
}

// responses
export interface ChatbotAPIPostResponse {
  success: boolean;
}

export interface ChatbotAPIPutResponse {
  success: boolean;
}

export interface DafaultCommandsResponse {
  commands: DafaultCommandsSlug;
  'link-protection': DafaultCommandsSlug;
  giveaway: DafaultCommandsSlug;
}

export interface CustomCommandsResponse {
  pagination: Pagination;
  data: CustomCommandsData;
}

export interface CommandVariablesResponse {
  [id: number] : CommandVariables;
}

export interface TimersResponse {
  pagination: Pagination;
  data: TimersData;
}

export interface ChatAlertsResponse {
  settings: ChatAlertsData;
  enabled: number;
}


// shared
export interface Permission {
  level: number;
  info?: PermissionInfo;
}

export interface PermissionInfo {
  [id: string]: any;
}

export interface Cooldown {
  global: number;
  user: number;
}

export interface Aliases {
  [id: number]: string;
}

export interface Pagination {
  current: number;
  total: number;
}

// default commands
export interface DefaultCommand {
  command: string;
  description: string;
  aliases: Aliases;
  response_type: string;
  success_response?: string;
  failed_response?: string;
  response?: string;
  static_permission?: Permission;
  permission?: Permission;
  enabled?: boolean;
  enabled_response?: string;
  disabled_response?: string;
}

export interface DafaultCommandsSlug {
  [id: string]: DefaultCommand;
}

// custom commands
export interface CustomCommandsData {
  [id: number]: CustomCommand;
}


export interface CustomCommandRow {
  id?: string;
  user_id?: number;
  command: string;
  permission: Permission;
  response: string;
  response_type?: string;
  cooldowns: Cooldown;
  aliases: Aliases;
  platforms: number;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}


export interface CustomCommand {
  id?: string;
  user_id?: number;
  command: string;
  permission: Permission;
  response: string;
  response_type?: string;
  cooldowns: Cooldown;
  aliases: Aliases;
  platforms: number;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

// command variables
export interface CommandVariables {
  [id: string]: any
}

// timers
export interface TimersData {
  [id: number]: Timer;
}

export interface Timer {
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

// chat alerts
export interface ChatAlertsData {
  streamlabs: StreamlabsChatAlert;
  twitch: TwitchChatAlert;
  youtube: YoutubeChatAlert;
  mixer: MixerChatAlert;
}

export interface StreamlabsChatAlert extends TipAlert {}

export interface TwitchChatAlert
  extends FollowerAlert, HostAlert, SubAlert, RaidAlert {}

export interface YoutubeChatAlert
  extends YTSubAlert, SponsorAlert, SuperchatAlert {}

export interface MixerChatAlert
  extends FollowerAlert, HostAlert, SubAlert {}


  // tips
export interface TipAlert {
  use_tip: boolean;
  tip_messages: TipMessage[];
}

export interface TipMessage {
  amount: number;
  message: string;
}

// followers
export interface FollowerAlert {
  use_follower: boolean;
  follower_messages: string[];
}

// hosts
export interface HostAlert {
  use_host: boolean;
  host_messages: HostMessage[];
}

export interface HostMessage {
  min_viewers: number;
  message: string;
}

// subscribers
export interface SubAlert {
  use_sub: boolean;
  subscriber_messages: {
    [id: string]: SubAlertMessage[];
  };
}

export interface SubAlertMessage {
  months: number;
  message: string;
  is_gifted?: boolean;
}

// raids
export interface RaidAlert {
  use_raids: boolean;
  raid_messages: RaidMessage[];
}

export interface RaidMessage {
  amount: number;
  message: string;
}

// youtube subscribers
export interface YTSubAlert {
  use_sub: boolean;
  subscriber_messages: string[];
}

// sponsors
export interface SponsorAlert {
  use_sponsor: boolean;
  sponsor_messsages: SponsorMessage[];
}

export interface SponsorMessage {
  months: number;
  message: string;
}

// superchat
export interface SuperchatAlert {
  use_superchat: boolean;
  superchat_messages: SuperchatMessage[];
}

export interface SuperchatMessage {
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