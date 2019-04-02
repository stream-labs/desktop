const sh = require('shelljs');

const logDir = '~/AppData/Roaming/slobs-client/node-obs/logs';


let tail;
let currentLog;

setInterval(() => {
  const logs = sh.ls(logDir);
  const lastLog = logs[logs.length - 1];

  if (lastLog !== currentLog) {
    if (tail) {
      tail.kill();
    }

    console.log('===========================================');
    console.log(`Tailing Log: ${lastLog}`);
    console.log('===========================================');

    tail = sh.exec(`tail -n +1 -f ${logDir}/"${lastLog}"`, { async: true });
    currentLog = lastLog;
  }
}, 5000);
