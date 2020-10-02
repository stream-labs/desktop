/**
 * Run this script to delete offline agents
 */
const https = require('https');

const getJSON = (url, options) => {
  return new Promise((resolve, reject) => {
    console.log('rest::getJSON');

    let output = '';

    const req = https.request(url, options, res => {
      console.log(`status: ${res.statusCode}`);
      res.setEncoding('utf8');

      res.on('data', chunk => {
        output += chunk;
      });

      res.on('end', () => {
        try {
          const obj = JSON.parse(output);
          resolve(obj);
        } catch (e) {
          console.log('is not json');
          resolve(output);
        }
      });
    });

    req.on('error', err => {
      reject(err);
    });

    req.end();
  });
};

(async function main() {
  const token = process.env.AZURE_PIPELINES_TOKEN;
  const base64token = Buffer.from(`PAT:${token}`).toString('base64');
  const agents = await getJSON(
    'https://dev.azure.com/streamlabs/_apis/distributedtask/pools/1/agents?api-version=5.1',
    {
      headers: {
        Authorization: `Basic ${base64token}`,
      },
    },
  );
  const offlineAgents = agents.value.filter(agent => agent.status === 'offline');
  for (const agent of offlineAgents) {
    console.log('try to delete', agent);
    const result = await getJSON(
      `https://dev.azure.com/streamlabs/_apis/distributedtask/pools/1/agents/${agent.id}?api-version=6.0-preview.1`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${base64token}`,
        },
      },
    );
    console.log(`delete agent ${agent.name}`, result);
  }
}());
