const net = require('net');


const PIPE_NAME = 'slobs';
const PIPE_PATH = '\\\\.\\pipe\\' + PIPE_NAME;
const PORT = 59652;

console.log('creating a socket');
const client = new net.Socket();


console.log('connection');
client.connect(59652, '127.0.0.1', () => {
  console.log('connected');

  client.write(JSON.stringify({
    jsonrpc: '0.2',
    id: 1,
    method: 'getScenes',
    params: { resource: 'ScenesService' }
  }));

  client.write('\n');

  client.write(JSON.stringify({
    jsonrpc: '0.2',
    id: 2,
    method: 'sceneSwitched',
    params: { resource: 'ScenesService' }
  }));

});

client.on('error', (error) => {
  console.log('error', error);
});

client.on('data', (data) => {
  console.log('Received: ' + data);
});

client.on('close', () => {
  console.log('Connection closed');
});


// WEBSOCKETS TEST

//
// const SockJS = require('sockjs-client');
//
// const sock = new SockJS('http://127.0.0.1:59652/api');
// sock.onopen = function() {
//   console.log('open');
//   sock.send(JSON.stringify({
//     jsonrpc: '0.2',
//     id: 1,
//     method: 'getScenes',
//     params: { resource: 'ScenesService' }
//   }));
//
//   sock.send(JSON.stringify({
//     jsonrpc: '0.2',
//     id: 2,
//     method: 'getItems',
//     params: { resource: 'Scene["37e441b9-9e1f-4e41-9971-6b615869aba3"]' }
//   }));
// };
//
// sock.onmessage = function(e) {
//   console.log('message', e.data);
// };
//
// sock.onerror = function(e) {
//   console.log('error', e);
// };
//
// sock.onclose = function(e) {
//   console.log('close', e);
// };