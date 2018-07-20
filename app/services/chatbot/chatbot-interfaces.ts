// state
export interface ChatbotApiServiceState {
  api_token: string;
  socket_token: string;
}

// responses
export interface DafaultCommandsResponse {
  commands: DafaultCommandSlug;
  'link-protection': DafaultCommandSlug;
  giveaway: DafaultCommandSlug;
}

export interface ChatbotAPIPostResponse {
  success: boolean;
}




export interface Permission {
  level: number;
  info?: any;
}

export interface DefaultCommandRow {
  command: string;
  description: string;
  aliases: string[];
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

export interface DafaultCommandSlug {
  [id: string]: DefaultCommandRow;
}

