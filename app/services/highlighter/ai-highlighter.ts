import path from 'path';
import { FFMPEG_DIR } from './constants';
import * as child from 'child_process';
import { getSharedResource } from '../../util/get-shared-resource';
const { spawn } = require('child_process');

const AI_PATH_PROD = getSharedResource('app.exe');
const AI_PATH_DEV = 'C:\\Users\\jan\\Documents\\Git\\GameHighlighter\\highlighter_api\\app.py';
const VENV_PATH =
  'C:\\Users\\jan\\Documents\\Git\\GameHighlighter\\.tiny-venv\\Scripts\\python.exe';
function getHighlighterProcess(videoUri: string) {
  const env = 'prod' as 'prod' | 'dev';

  if (env === 'dev') {
    return spawn(VENV_PATH, [AI_PATH_DEV, videoUri]);
  } else {
    return spawn(AI_PATH_PROD, [videoUri]);
  }
}
export function getHighlightClips(videoUri: string) {
  return new Promise((resolve, reject) => {
    console.log(`Get highlight clips for ${videoUri}`);
    if (videoUri.includes('djnardi')) {
      console.log('Use djnardi test data');
      resolve(
        JSON.parse(
          '[{"start_time":118.0,"end_time":null,"type":"deploy","origin":"deploy detection","start_timestamp":"00:01:58","end_timestamp":null},{"start_time":142.73,"end_time":null,"type":"kill","origin":"ocr crosshair, ocr lower","start_timestamp":"00:02:22","end_timestamp":null},{"start_time":245.73,"end_time":null,"type":"kill","origin":"ocr crosshair, ocr lower","start_timestamp":"00:04:05","end_timestamp":null}]',
        ),
      );
    }

    console.log('Start Ai analysis');

    const childProcess: child.ChildProcess = getHighlighterProcess(videoUri);
    childProcess.stdout?.on('data', data => {
      const message = data.toString() as string;
      // console.log('Normal logs:', data.toString());
      if (message.includes('>>>>') && message.includes('<<<<')) {
        const start = message.indexOf('>>>>');
        const end = message.indexOf('<<<<');

        const jsonString = message.substring(start, end).replace('>>>>', '');

        console.log('\n\n');
        console.log(jsonString);
        console.log('\n\n');

        const jsonResponse = JSON.parse(jsonString);
        resolve(jsonResponse);
      }
    });
    childProcess.stderr?.on('data', (data: string) => {
      console.log('Error logs:', data.toString());
    });
  });
}
