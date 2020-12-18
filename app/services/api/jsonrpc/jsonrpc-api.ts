/**
 * @see http://www.jsonrpc.org/specification
 */
export enum E_JSON_RPC_ERROR {
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_JSON_RPC_ERROR = -32603,
  INTERNAL_SERVER_ERROR = -32000,
}

export interface IJsonRpcRequest {
  jsonrpc: '2.0';
  id: string;
  method: string;
  params: {
    resource: string;
    args?: any[];
    compactMode?: boolean;
    noReturn?: boolean;
    windowId?: string;

    /**
     * Replaces the old `fetchMutations` option.
     * When passed in a synchronous request, the response will include
     * all mutations after this id that are required to be fully
     * caught up.
     */
    mutationId?: number;
  };
}

export interface IJsonRpcResponse<TResponse> {
  jsonrpc: '2.0';
  id?: string | number;
  result?: TResponse;
  error?: {
    code: number;
    message?: string;
  };

  /**
   * Contains the mutations since `mutationId`, if
   * `mutationId` was passed in the original request.
   */
  mutations?: IMutation[];

  /**
   * The id of the last mutation executed at the time this
   * response was sent.
   */
  mutationId?: number;
}

declare type TResourceType = 'HELPER' | 'SUBSCRIPTION' | 'EVENT';

export interface IJsonRpcEvent {
  _type: 'EVENT';
  resourceId: string;
  emitter: 'PROMISE' | 'STREAM';
  data: any;
  isRejected?: boolean; // for PROMISE emitter only
}

export interface IMutation {
  id: number;
  type: string;
  payload: any;
}

export interface IJsonrpcServiceApi {
  createRequest(resourceId: string, method: string, ...args: any[]): IJsonRpcRequest;
}
