// apiClient.ts (combined with types and createApiClient)

import { useEffect } from 'react';
import useSWR, { mutate as globalMutate, SWRResponse } from 'swr';
import SockJS from "sockjs-client/dist/sockjs"
// Polyfill for 'global' to fix the error
const global = globalThis;

type Subscription = {
  unsubscribe(): void;
};

export interface EventStream<T> {
  subscribe(callback: (data: T) => void): Subscription;
}
type SWRHook<R, A extends any[]> = (...args: A) => SWRResponse<R, any>;
type SubscribeHook<T> = (callback: (data: T) => void) => void;

type AttachSWR<T extends (...args: any[]) => Promise<any>> = T & {
  useSWR: SWRHook<Awaited<ReturnType<T>>, Parameters<T>>;
};

type AttachSubscribe<T> = EventStream<T> & {
  useSubscribe: SubscribeHook<T>;
};

export type PromisifyMethods<T> = {
  [K in keyof T]: T[K] extends EventStream<infer U>
    ? AttachSubscribe<U>
    : T[K] extends (...args: infer A) => infer R
    ? AttachSWR<(...args: A) => Promise<Awaited<R>>>
    : T[K] extends object
    ? PromisifyMethods<T[K]>
    : T[K];
};

class ApiClient {
  private socket: SockJS;
  private nextRequestId = 1;
  private requests: {
    [id: number]: { resolve: Function; reject: Function };
  } = {};
  private subscriptions: {
    [id: number]: { resourceId: string; callback: Function };
  } = {};
  private token: string;
  private connectionStatus: 'disconnected' | 'pending' | 'connected' = 'disconnected';

  constructor(private url: string, token: string) {
    this.token = token;
    this.connect();
  }

  private connect() {
    if (this.connectionStatus !== 'disconnected') return;
    this.connectionStatus = 'pending';
    this.socket = new SockJS(this.url);

    this.socket.onopen = () => {
      console.log('SockJS connection opened.');
      // Authenticate with the token
      this.request('TcpServerService', 'auth', this.token)
        .then(() => {
          console.log('Authenticated');
          this.connectionStatus = 'connected';
        })
        .catch((error) => {
          console.error('Authentication failed:', error);
          this.socket.close();
        });
    };

    this.socket.onmessage = this.onMessage.bind(this);

    this.socket.onclose = (event) => {
      console.log('SockJS connection closed:', event);
      this.connectionStatus = 'disconnected';
      // Optionally handle reconnection logic here
    };

    this.socket.onerror = (error) => {
      console.error('SockJS error:', error);
    };
  }

  private onMessage(event: MessageEvent) {
    const message = JSON.parse(event.data);
    const { id, result, error } = message;

    if (id && this.requests[id]) {
      const pending = this.requests[id];
      if (error) {
        pending.reject(error);
      } else {
        pending.resolve(result);
      }
      delete this.requests[id];
    } else if (result && result._type === 'EVENT') {
      const { resourceId, data } = result;
      const subscription = Object.values(this.subscriptions).find(
        (sub) => sub.resourceId === resourceId
      );
      if (subscription) {
        subscription.callback(data);
      }
    }
  }

  public request(
    resourceId: string,
    methodName: string,
    ...args: any[]
  ): Promise<any> {
    const id = this.nextRequestId++;
    const requestBody = {
      jsonrpc: '2.0',
      id,
      method: methodName,
      params: { resource: resourceId, args },
    };
    return new Promise((resolve, reject) => {
      this.requests[id] = { resolve, reject };
      if (this.socket.readyState === SockJS.OPEN) {
        this.socket.send(JSON.stringify(requestBody));
      } else {
        this.socket.addEventListener('open', () => {
          this.socket.send(JSON.stringify(requestBody));
        });
      }
    });
  }

  public subscribe(
    resourceId: string,
    channelName: string,
    callback: Function
  ): Subscription {
    const id = this.nextRequestId++;
    const requestBody = {
      jsonrpc: '2.0',
      id,
      method: channelName,
      params: { resource: resourceId, args: [] },
    };

    this.requests[id] = {
      resolve: (subscriptionInfo: any) => {
        this.subscriptions[id] = {
          resourceId: subscriptionInfo.resourceId,
          callback,
        };
      },
      reject: (error: any) => {
        console.error('Subscription error:', error);
      },
    };

    if (this.socket.readyState === SockJS.OPEN) {
      this.socket.send(JSON.stringify(requestBody));
    } else {
      this.socket.addEventListener('open', () => {
        this.socket.send(JSON.stringify(requestBody));
      });
    }

    return {
      unsubscribe: () => {
        this.unsubscribe(id);
      },
    };
  }

  private unsubscribe(subscriptionId: number) {
    delete this.subscriptions[subscriptionId];
  }
}

function createApiClient<T extends object>(client: ApiClient): PromisifyMethods<T> {
  const apiProxyHandler: ProxyHandler<any> = {
    get(target, serviceName: string) {
      const serviceProxyHandler: ProxyHandler<any> = {
        get(target, methodName: string) {
          const useSubscribe = (callback: (data: any) => void) => {
            useEffect(() => {
              const subscription = client.subscribe(serviceName, methodName, callback);
              return () => {
                subscription.unsubscribe();
              };
            }, [callback]);
          };

          // Return a function that can be called or has a 'subscribe' method
          const method = (...args: any[]) => {
            return client.request(serviceName, methodName, args);
          };

          // Attach the 'subscribe' method to the function
          Object.defineProperty(method, 'subscribe', {
            value: useSubscribe,
            writable: false,
          });

          // Attach the 'useSubscribe' method
          Object.defineProperty(method, 'useSubscribe', {
            value: useSubscribe,
            writable: false,
          });

          // Attach useSWR for getter methods
          Object.defineProperty(method, 'useSWR', {
            value: (...args: any[]) => {
              const key = [serviceName, methodName, ...args];
              const swrResponse = useSWR(key, () => method(...args));

              // Redefine mutate to automatically invalidate the SWR cache
              const newMutate = () => globalMutate(key);

              return {
                ...swrResponse,
                mutate: newMutate,
              };
            },
            writable: false,
          });

          return method;
        },
      };

      return new Proxy({}, serviceProxyHandler);
    },
  };

  return new Proxy({}, apiProxyHandler) as PromisifyMethods<T>;
}

export { ApiClient, createApiClient };
