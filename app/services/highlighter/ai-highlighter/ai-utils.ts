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
      '[{"start_time":118.0,"end_time":null,"type":"deploy","origin":"deploy detection","start_timestamp":"00:01:58","end_timestamp":null},{"start_time":142.73,"end_time":null,"type":"kill","origin":"ocr crosshair, ocr lower","start_timestamp":"00:02:22","end_timestamp":null},{"start_time":245.73,"end_time":null,"type":"kill","origin":"ocr crosshair, ocr lower","start_timestamp":"00:04:05","end_timestamp":null}]',
    );
  } else if (videoUri.includes('2024-07-18') || videoUri.includes('2024-07-22')) {
    console.log('Use other test data');
    return JSON.parse(
      '[{"start_time":0,"end_time":null,"type":"deploy","origin":"deploy detection","start_timestamp":"00:00:05","end_timestamp":null}]',
    );
  }
}
