import { getClient } from './api-client';

// prevent logs to be sent in stdout
console.log = () => {};

!(async function () {

  const resource = process.argv[2];
  const method = process.argv[3];

  const args = process.argv.slice(4);

  const client = await getClient();
  client.request(resource, method, ...args).then(
    response => {
      process.stdout.write(JSON.stringify(response));
    },
    error => {
      process.stderr.write(JSON.stringify(error));
    }
  );
  client.disconnect();

})();




