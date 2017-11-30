const net = require('net');
const { spawnSync } = require('child_process');
const  traverse = require('traverse');

const PIPE_NAME = 'slobs';
const PIPE_PATH = '\\\\.\\pipe\\' + PIPE_NAME;

let clientInstance = null;

export class ApiClient {

  constructor() {

    this.nextRequestId = 1;
    this.socket = new net.Socket();
    this.resolveConnection = null;
    this.rejectConnection = null;
    this.requests = {};
    this.subscriptions = {};
    this.connectionStatus = 'disconnected'; // disconnected|pending|connected

    // set to 'true' for debugging
    this.logsEnabled = false;

    this.socket.on('connect', () => {
      this.log('connected');
      this.connectionStatus = 'connected';
      this.resolveConnection();
    });

    this.socket.on('error', (error) => {
      this.log('error', error);
      this.connectionStatus = 'disconnected';
      this.rejectConnection();
    });

    this.socket.on('data', (data) => {
      this.log(`Received: ${data}`);
      this.onMessageHandler(data);
    });

    this.socket.on('close', () => {
      this.connectionStatus = 'disconnected';
      this.log('Connection closed');
    });
  }

  connect() {
    this.log('connecting...');
    this.connectionStatus = 'pending';
    return new Promise((resolve, reject) => {
      this.resolveConnection = resolve;
      this.rejectConnection = reject;
      this.socket.connect(PIPE_PATH);
    });
  }


  disconnect() {
    this.socket.end();
  }


  log(...messages) {
    if (this.logsEnabled) console.log(...messages);
  }


  async request(resourceId, methodName, ...args) {

    if (this.connectionStatus === 'disconnected') {
      await this.connect();
    }

    const id = this.nextRequestId++;
    const requestBody = {
      jsonrpc: '2.0',
      id,
      method: methodName,
      params: { resource: resourceId, args }
    };
    return this.sendMessage(requestBody);
  }


  requestSync(resourceId, methodName, ...args) {
    const process = spawnSync(
      'node',
      ['./test-dist/helpers/cmd-client.js', resourceId, methodName, args.join(' ')]
    );

    const err = process.stderr.toString();
    if (err) throw err;
    const response = JSON.parse(process.stdout.toString());
    return response;
  }


  sendMessage(message) {
    let requestBody = message;
    if (typeof message === 'string') {
      try {
        requestBody = JSON.parse(message);
      } catch (e) {
        throw 'Invalid JSON';
      }
    }

    if (!requestBody.id) throw 'id is required';

    return new Promise((resolve, reject) => {
      this.requests[requestBody.id] = {
        body: requestBody,
        resolve,
        reject,
        completed: false
      };
      const rawMessage = JSON.stringify(requestBody) + '\n';
      this.log('Sent:', rawMessage);
      this.socket.write(rawMessage);
    });
  }


  onMessageHandler(data) {
    data.toString().split('\n').forEach(rawMessage => {
      if (!rawMessage) return;
      const message = JSON.parse(rawMessage);
      const request = this.requests[message.id];

      if (request) {
        if (message.error) {
          request.reject(message.error);
        } else {
          request.resolve(message.result);
        }
        delete this.requests[message.id];
      }

      const result = message.result;
      if (!result) return;

      if (result._type === 'EVENT') {
        this.subscriptions[message.result.resourceId](result.data);
      }
    });

  }


  subscribe(resourceId, channelName, cb) {
    this.request(resourceId, channelName).then(subscriptionInfo => {
      this.subscriptions[subscriptionInfo.resourceId] = cb;
    });
  }

  unsubscribe(subscriptionId) {
    return this.request(subscriptionId, 'unsubscribe');
  }

  unsubscribeAll() {
    return Promise.all(
      Object.keys(this.subscriptions).map(subscriptionId => this.unsubscribe(subscriptionId))
    );
  }

  getResource(resourceId, resourceModel = {}) {
    return new Proxy(resourceModel, {
      get: (target, property, receiver) => {


        if (resourceModel[property]) return resourceModel[property];


        return (...args) => {

          const result = this.requestSync(resourceId, property, ...args);

          // TODO: add promises support
          if (result && result._type === 'HELPER') {
            return this.getResource(result.resourceId, result);
          } else {
            // result can contain helpers-objects
            traverse(result).forEach((item) => {
              if (item && item._type === 'HELPER') {
                return this.getResource(result.resourceId, result);
              }
            });
            return result;
          }

        };
      }
    });
  }
}


export class Resource {

  constructor(id) {
    this.id = id;
  }

}


export async function getClient() {
  if (clientInstance) return clientInstance;
  clientInstance = new ApiClient();
  await clientInstance.connect();
  return clientInstance;
}