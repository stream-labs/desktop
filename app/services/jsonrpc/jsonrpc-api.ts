

/**
 * @see http://www.jsonrpc.org/specification
 */
export enum E_JSON_RPC_ERROR {
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_JSON_RPC_ERROR = -32603,
  INTERNAL_SERVER_ERROR = -32000
}

export interface IJsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params: {
    resource: string,
    args?: any[],
    fetchMutations?: boolean,
    compactMode?: boolean
  };
}

export interface IJsonRpcResponse<TResponse> {
  jsonrpc: '2.0';
  id?: string | number;
  result?: TResponse;
  error?: {
    code: number;
    message?: string
  };
  mutations?: IMutation[];
}

declare type TResourceType = 'HELPER' | 'SUBSCRIPTION' | 'EVENT';


export interface IJsonRpcEvent {
  _type: 'EVENT';
  resourceId: string;
  emitter: 'PROMISE' | 'STREAM';
  data: any;
  isRejected?: boolean;  // for PROMISE emitter only
}