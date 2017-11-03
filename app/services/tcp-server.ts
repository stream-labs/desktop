import { Service } from './service';
import {
  E_JSON_RPC_ERROR, IJsonRpcEvent, IJsonRpcRequest, IJsonRpcResponse,
  ServicesManager
} from '../services-manager';
import { Socket } from 'net';

const net = require('net');

const DEFAULT_TCP_PORT = 59652;
const HOSTNAME = '127.0.0.1';

const PIPE_NAME = 'slobs';
const PIPE_PATH = '\\\\.\\pipe\\' + PIPE_NAME;


interface IClient {
  id: number;
  socket: ISocket;
  subscriptions: string[];
}

interface IServer {
  on(eventName: string, cb: (event: any) => any): any;
}

interface ISocket {
  write(data: string | Buffer): any;
  on(eventName: string, cb: (event: any) => any): any;
}


export class TcpServerService extends Service {

  servicesManager: ServicesManager = ServicesManager.instance;

  private clients: Dictionary<IClient> = {};
  private nextClientId = 1;


  listenWebsokets() {
    this.listenConnections(this.createWebsoketsServer());
  }


  listenNamedPipe() {
    this.listenConnections(this.createNamedPipeServer());
  }


  listenTcp() {
    this.listenConnections(this.createTcpServer());
  }


  private listenConnections(server: IServer) {
    server.on('connection', (socket: ISocket) => this.onConnectionHandler(socket));

    server.on('error', (error) => {
      throw error;
    });

    this.servicesManager.serviceEvent.subscribe(event => this.onServiceEventHandler(event));

    console.log('tcp-server created');
  }

  private createNamedPipeServer() {
    const server = net.createServer();
    server.listen(PIPE_PATH);
    return server;
  }


  private createTcpServer() {
    const server = net.createServer();
    server.listen(DEFAULT_TCP_PORT, HOSTNAME);
    return server;
  }


  private createWebsoketsServer() {
    const http = require('http');
    const sockjs = require('sockjs');
    const server = sockjs.createServer();
    const httpServer = http.createServer();
    server.installHandlers(httpServer, { prefix:'/api' });
    httpServer.listen(DEFAULT_TCP_PORT, HOSTNAME);
    return server;
  }


  private onConnectionHandler(socket: ISocket) {
    console.log('new connection');

    const id = this.nextClientId++;
    const client: IClient = { id, socket, subscriptions: [] };
    this.clients[id] = client;

    socket.on('data', (data: any) => {
      this.onRequestHandler(client, data.toString());
    });

    socket.on('end', () => {
      this.onDisconnectHandler(client);
    });

    socket.on('close', () => {
      this.onDisconnectHandler(client);
    });
  }


  private onRequestHandler(client: IClient, data: string) {
    console.log('tcp request', data);
    const requests = data.split('\n');
    requests.forEach(requestString => {
      if (!requestString) return;
      try {
        const request: IJsonRpcRequest = JSON.parse(requestString);

        const errorMessage = this.validateRequest(request);

        if (errorMessage) {
          const errorResponse = this.servicesManager.createErrorResponse({
            code: E_JSON_RPC_ERROR.INVALID_PARAMS,
            message: errorMessage,
            id: String(request.id)
          });
          this.sendResponse(client, errorResponse);
        }

        // handle unsubscribing by clearing client subscriptions
        if (request.method === 'unsubscribe' && this.servicesManager.subscriptions[request.params.resource]) {
          const subscriptionInd = client.subscriptions.indexOf(request.params.resource);
          if (subscriptionInd !== -1) client.subscriptions.splice(subscriptionInd, 1);
          this.sendResponse(client,{
            jsonrpc: '2.0',
            result: subscriptionInd !== -1
          });
          return;
        }

        const response = this.servicesManager.executeServiceRequest(request);

        // if response is subscription then add this subscription to client
        if (response.result && response.result._type === 'SUBSCRIPTION') {
          client.subscriptions.push(response.result.resourceId);
        }
        this.sendResponse(client, response);
      } catch (e) {
        this.sendResponse(
          client,
          this.servicesManager.createErrorResponse({ code: E_JSON_RPC_ERROR.INVALID_REQUEST }));
      }
    });
  }


  private onServiceEventHandler(event: IJsonRpcResponse<IJsonRpcEvent>) {
    // send event to subscribed clients
    Object.keys(this.clients).forEach(clientId => {
      const client = this.clients[clientId];
      if (client.subscriptions.includes(event.result.resourceId)) this.sendResponse(client, event);
    });
  }


  private validateRequest(request: IJsonRpcRequest): string {
    let message = '';
    if (!request.id) message += ' id is required;';
    if (!request.params) message += ' params is required;';
    if (request.params && !request.params.resource) message += ' resource is required;';
    return message;
  }


  private onDisconnectHandler(client: IClient) {
    console.log('client disconnected');
    delete this.clients[client.id];
  }


  private sendResponse(client: IClient, response: IJsonRpcResponse<any>) {
    client.socket.write(JSON.stringify(response));
  }

}
