import { getSharedResource } from '../../../util/get-shared-resource';
const { spawn } = require('child_process');

const AI_PATH_PROD = getSharedResource('app.exe');
const AI_PATH_DEV = '<path to highlighter-api repository>/highlighter_api/app.py'; // path to app.py of the highlighter repository
const VENV_PATH = 'python'; // path to python in virtual environment

export function getHighlighterProcess(videoUri: string) {
  const env = 'dev' as 'prod' | 'dev';

  if (env === 'dev') {
    return spawn(VENV_PATH, [AI_PATH_DEV, videoUri]);
  } else {
    return spawn(AI_PATH_PROD, [videoUri]);
  }
}

export function getTestData(videoUri: string) {
  if (videoUri.includes('djnardi')) {
    console.log('Use djnardi test data');
    return JSON.parse(
      '[{"start_time":118.0,"end_time":null,"type":"deploy","origin":"deploy detection","start_timestamp":"00:01:58","end_timestamp":nul},{"start_time":142.73,"end_time":null,"type":"kill","origin":"ocr crosshair, ocr lower","start_timestamp":"00:02:22","end_timestamp":nul},{"start_time":245.73,"end_time":null,"type":"kill","origin":"ocr crosshair, ocr lower","start_timestamp":"00:04:05","end_timestamp":null}]',
    );
  } else if (videoUri.includes('2024-07-18') || videoUri.includes('2024-07-22')) {
    console.log('Use other test data');
    return JSON.parse(
      '[{"start_time":0,"end_time":null,"type":"deploy","origin":"deploy detection","start_timestamp":"00:00:05","end_timestamp":null}]',
    );
  } else if (videoUri.includes('Trio')) {
    console.log('Use other test data');
    return JSON.parse(
      '[{"start_time": 242.0,"end_time": null,"type": "deploy","origin": "deploy detection","start_timestamp": "00:04:02","end_timestamp": null}, {"start_time": 1563.0,"end_time": null,"type": "deploy","origin": "deploy detection","start_timestamp": "00:26:03","end_timestamp": null}, {"start_time": 1278.0,"end_time": null,"type": "victory","origin": "victory detection","start_timestamp": "00:21:18","end_timestamp": null}, {"start_time": 2548.0,"end_time": null,"type": "death","origin": "death detection","start_timestamp": "00:42:28","end_timestamp": null}, {"start_time": 337.0,"end_time": null,"type": "kill","origin": "ocr crosshair, ocr lower","start_timestamp": "00:05:37","end_timestamp": null}, {"start_time": 344.0,"end_time": null,"type": "kill","origin": "ocr crosshair, ocr lower","start_timestamp": "00:05:44","end_timestamp": null}, {"start_time": 510.0,"end_time": null,"type": "kill","origin": "ocr lower","start_timestamp": "00:08:30","end_timestamp": null}, {"start_time": 559.0,"end_time": null,"type": "kill","origin": "ocr crosshair","start_timestamp": "00:09:19","end_timestamp": null}, {"start_time": 573.0,"end_time": null,"type": "kill","origin": "ocr crosshair","start_timestamp": "00:09:33","end_timestamp": null}, {"start_time": 611.0,"end_time": null,"type": "kill","origin": "ocr lower","start_timestamp": "00:10:11","end_timestamp": null}, {"start_time": 616.0,"end_time": null,"type": "kill","origin": "ocr crosshair","start_timestamp": "00:10:16","end_timestamp": null}, {"start_time": 687.0,"end_time": null,"type": "kill","origin": "ocr crosshair, ocr lower","start_timestamp": "00:11:27","end_timestamp": null}, {"start_time": 692.0,"end_time": null,"type": "kill","origin": "ocr crosshair, ocr lower","start_timestamp": "00:11:32","end_timestamp": null}, {"start_time": 748.0,"end_time": null,"type": "kill","origin": "ocr crosshair, ocr lower","start_timestamp": "00:12:28","end_timestamp": null}, {"start_time": 885.0,"end_time": null,"type": "kill","origin": "ocr crosshair","start_timestamp": "00:14:45","end_timestamp": null}, {"start_time": 892.0,"end_time": null,"type": "kill","origin": "ocr lower","start_timestamp": "00:14:52","end_timestamp": null}, {"start_time": 902.0,"end_time": null,"type": "kill","origin": "ocr crosshair, ocr lower","start_timestamp": "00:15:02","end_timestamp": null}, {"start_time": 936.0,"end_time": null,"type": "kill","origin": "ocr crosshair","start_timestamp": "00:15:36","end_timestamp": null}, {"start_time": 981.0,"end_time": null,"type": "kill","origin": "ocr crosshair, ocr lower","start_timestamp": "00:16:21","end_timestamp": null}, {"start_time": 1012.0,"end_time": null,"type": "kill","origin": "ocr lower","start_timestamp": "00:16:52","end_timestamp": null}, {"start_time": 1179.0,"end_time": null,"type": "kill","origin": "ocr lower","start_timestamp": "00:19:39","end_timestamp": null}, {"start_time": 1220.0,"end_time": null,"type": "kill","origin": "ocr crosshair, ocr lower","start_timestamp": "00:20:20","end_timestamp": null}, {"start_time": 1229.0,"end_time": null,"type": "kill","origin": "ocr crosshair, ocr lower","start_timestamp": "00:20:29","end_timestamp": null}, {"start_time": 1589.0,"end_time": null,"type": "kill","origin": "ocr crosshair","start_timestamp": "00:26:29","end_timestamp": null}, {"start_time": 1610.0,"end_time": null,"type": "kill","origin": "ocr crosshair","start_timestamp": "00:26:50","end_timestamp": null}, {"start_time": 1823.0,"end_time": null,"type": "kill","origin": "ocr crosshair","start_timestamp": "00:30:23","end_timestamp": null}, {"start_time": 1900.0,"end_time": null,"type": "kill","origin": "ocr crosshair","start_timestamp": "00:31:40","end_timestamp": null}, {"start_time": 1998.0,"end_time": null,"type": "kill","origin": "ocr lower","start_timestamp": "00:33:18","end_timestamp": null}, {"start_time": 2002.0,"end_time": null,"type": "kill","origin": "ocr lower","start_timestamp": "00:33:22","end_timestamp": null}, {"start_time": 2021.0,"end_time": null,"type": "kill","origin": "ocr crosshair","start_timestamp": "00:33:41","end_timestamp": null}, {"start_time": 2033.0,"end_time": null,"type": "kill","origin": "ocr lower","start_timestamp": "00:33:53","end_timestamp": null}, {"start_time": 2060.0,"end_time": null,"type": "kill","origin": "ocr crosshair","start_timestamp": "00:34:20","end_timestamp": null}, {"start_time": 2145.0,"end_time": null,"type": "kill","origin": "ocr crosshair, ocr lower","start_timestamp": "00:35:45","end_timestamp": null}, {"start_time": 2152.0,"end_time": null,"type": "kill","origin": "ocr crosshair, ocr lower","start_timestamp": "00:35:52","end_timestamp": null}, {"start_time": 2165.0,"end_time": null,"type": "kill","origin": "ocr crosshair","start_timestamp": "00:36:05","end_timestamp": null}, {"start_time": 2436.0,"end_time": null,"type": "kill","origin": "ocr crosshair, ocr lower","start_timestamp": "00:40:36","end_timestamp": null}]',
    );
  }
}
