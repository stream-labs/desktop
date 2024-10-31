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
  useQuery: SWRHook<Awaited<ReturnType<T>>, Parameters<T>>;
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
    [id: string]: { resolve: Function; reject: Function };
  } = {};
  private subscriptions: {
    [id: string]: { resourceId: string; id: string, callback: Function, once?: boolean };
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
      console.debug('SockJS connection opened.');
      // Authenticate with the token
      this.request('TcpServerService', 'auth', this.token)
        .then(() => {
          console.debug('Authenticated');
          this.connectionStatus = 'connected';
        })
        .catch((error) => {
          console.error('Authentication failed:', error);
          this.socket.close();
        });
    };

    this.socket.onmessage = this.onMessage.bind(this);

    this.socket.onclose = (event) => {
      console.debug('SockJS connection closed:', event);
      this.connectionStatus = 'disconnected';
      // Optionally handle reconnection logic here
    };

    this.socket.onerror = (error) => {
      console.error('SockJS error:', error);
    };
  }


  public disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connectionStatus = 'disconnected';
    this.requests = {};
    this.subscriptions = {};
    console.debug('ApiClient disconnected.');
  }

  private onMessage(event: MessageEvent) {
    const message = JSON.parse(event.data);
    const { id, result, error } = message;
    const isResponse = id && this.requests[id];


    if (isResponse) {
      const pending = this.requests[id];
      if (error) {
        pending.reject(error);
      } else {
        const { resourceId, emitter } = result;
        if (emitter === 'PROMISE') {
          // If the result is a promise, we need to subscribe to the result
          this.subscriptions[id] = {
            id,
            resourceId,
            callback: data => pending.resolve(data),
            once: true,
          };
          console.debug(`%c<<TASK STARTED`, 'color: orange', id, message);
        } else { //otherwise, resolve the request promise with the result
          if (result._type === 'SUBSCRIPTION') {
            if ('value' in result) {
              console.debug(`%c<<SUBSCRIPTION CONFIRMED with value`, 'color: orange', id, message);
              callSubscriptionCallback(this.subscriptions[id], result.value);
            } else {
              console.debug(`%c<<SUBSCRIPTION CONFIRMED`, 'color: orange', id, message);
            }
          } else {
            console.debug(`%c<<RESPONSE`, 'color: orange', id, message);
          }
          pending.resolve(result);
        }
      }
      // Remove the request from the pending requests
      delete this.requests[id];
    } else if (result && result._type === 'EVENT') { // if the message is an event, call the subscription callback
      const { resourceId, data } = result;
      const subscriptions = Object.values(this.subscriptions).filter(
        (sub) => sub.resourceId === resourceId
      );
      for (const subscription of subscriptions) {

          if (subscription.once) {
            this.unsubscribe(id);
            console.debug(`%c<<TASK COMPLETED`, 'color: orange', subscription.id, message);
          } else {
            console.debug(`%c<<EVENT`, 'color: orange', subscription.id, message);
          }
          callSubscriptionCallback(subscription, data);
      }

    }
  }

  public request(
    resourceId: string,
    methodName: string,
    ...args: unknown[]
  ): Promise<unknown> {
    const id = `${resourceId}.${methodName}.${this.nextRequestId++}`;
    const requestBody = {
      jsonrpc: '2.0',
      id,
      method: methodName,
      params: { resource: resourceId, args },
    };
    return new Promise((resolve, reject) => {
      this.requests[id] = { resolve, reject };
      const json = JSON.stringify(requestBody);
      if (this.socket.readyState === SockJS.OPEN) {
        this.socket.send(json);
      } else {

        this.socket.addEventListener('open', () => {
          this.socket.send(json);
        });
      }
      console.debug(`%c>>SEND ${id}`,'color: lightgreen', requestBody);
    });
  }

  public subscribe(
    resourceId: string,
    channelName: string,
    callback: Function
  ): Subscription {
    const id = `${resourceId}.${channelName}.${this.nextRequestId++}`;
    const requestBody = {
      jsonrpc: '2.0',
      id,
      method: channelName,
      params: { resource: resourceId, args: [] },
    };

    // create a new subscription object locally
    this.subscriptions[id] = {
      id,
      channelName,
      callback,
      resourceId: null // resourceId will be set when the subscription is confirmed
    };

    // create a new request to the server
    this.requests[id] = {
      resolve: (subscriptionInfo: any) => {
        // the server has confirmed the subscription
        this.subscriptions[id].resourceId = subscriptionInfo.resourceId;
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
    console.debug(`%c>>SUBSCRIBE ${id}`,'color: lightgreen', requestBody);

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


          const subscribe = (callback: any) => client.subscribe(serviceName, methodName, callback);

          // Custom hook to subscribe to events
          const useSubscribe = (callback: (data: any) => void) => {
            useEffect(() => {
              const subscription = subscribe(callback);
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
            value: subscribe,
            writable: false,
          });

          // Attach the 'useSubscribe' method
          Object.defineProperty(method, 'useSubscribe', {
            value: useSubscribe,
            writable: false,
          });

          // Attach useSWR for getter methods
          Object.defineProperty(method, 'useQuery', {
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

function callSubscriptionCallback(subscription: { callback: Function | { next: Function, error: Function, complete: Function} }, data: any) {
  if (typeof subscription.callback === 'function') {
    subscription.callback(data);
    return;
  }
  return subscription.callback.next(data);
}

export { ApiClient, createApiClient };
