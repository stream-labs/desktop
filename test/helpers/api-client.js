const net = require('net');

// TCP TEST

const PIPE_NAME = 'slobs';
const PIPE_PATH = '\\\\.\\pipe\\' + PIPE_NAME;

export class ApiClient {

  resolveConnection = null;
  rejectConnection = null;
  nextRequestId = 1;
  socket = new net.Socket();
  requests = {};

  constructor() {

    this.socket.on('connect', () => {
      console.log('connected');
      this.resolveConnection();
    });

    this.socket.on('error', (error) => {
      console.log('error', error);
      this.rejectConnection();
    });

    this.socket.on('data', (data) => {
      console.log(`Received: ${data}`);
    });

    this.socket.on('close', () => {
      console.log('Connection closed');
    });
  }

  connect() {

    return new Promise((resolve, reject) => {
      this.resolveConnection = resolve;
      this.rejectConnection = reject;
      this.socket.connect(PIPE_PATH);
    });

  }


  request(resourceId, methodName, ...args) {
    const id = this.nextRequestId++;
    const requestBody = {
      jsonrpc: '2.0',
      id,
      method: methodName,
      params: { resource: resourceId, args }
    };
    return this.sendMessage(requestBody);
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

    this.logMessage(requestBody, 'request');

    return new Promise((resolve, reject) => {
      this.requests[requestBody.id] = {
        body: requestBody,
        resolve,
        reject,
        completed: false
      };
      this.socket.send(JSON.stringify(requestBody));
    });
  }


  onMessageHandler(data) {
    const message = JSON.parse(data);
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

  }


  subscribe(resourceId, channelName, cb) {
    this.request(resourceId, channelName).then(subscriptionInfo => {
      this.subscriptions[subscriptionInfo.resourceId] = cb;
    });
  }
}
