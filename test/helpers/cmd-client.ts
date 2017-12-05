import { getClient } from './api-client';

// prevent logs to be sent in stdout
console.log = () => {};

!(async function () {

  const resource = process.argv[2];
  const method = process.argv[3];
  const args = process.argv.slice(4);

  // console.info('args', args);

  // parse arguments
  args.forEach((arg, ind) => {
    if (arg.charAt(0) === '"') {
      args[ind] = arg.substring(1, arg.length - 1);
    } else {
      // console.info('argis', args[ind]);
      args[ind] = JSON.parse(args[ind]);
    }
  });

  // console.info(args);

  const client = await getClient();
  client.request(resource, method, ...args).then(response => {
    let responseStr = '';
    if (response === void 0) {
      responseStr = 'true';
    } else {
      responseStr = JSON.stringify(response);
    }
    process.stdout.write(responseStr);
  }).catch(error => {
    process.stderr.write(JSON.stringify(error));
  }).then(() => {
    client.disconnect();
  });



})();




