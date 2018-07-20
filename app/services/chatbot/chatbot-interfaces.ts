// state
export interface ChatbotApiServiceState {
  api_token: string;
  socket_token: string;
}

// responses
export interface ChatbotAPIPostResponse {
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


// shared
export interface Permission {
  level: number;
  info?: any;
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
export interface DefaultCommandRow {
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
  [id: string]: DefaultCommandRow;
}

// custom commands
export interface CustomCommandsData {
  [id: number]: CustomCommandRow;
}


export interface CustomCommandRow {
  id: string;
  user_id: number;
  command: string;
  permision: Permission;
  response: string;
  cooldowns: Cooldown;
  aliases: Aliases;
  platforms: number;
  enabled: number;
  created_at: string;
  updated_at: string;
}
