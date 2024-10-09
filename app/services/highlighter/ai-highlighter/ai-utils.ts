import { getSharedResource } from '../../../util/get-shared-resource';
import { FFMPEG_DIR, FFMPEG_EXE } from '../constants';
import { IHighlight } from './ai-highlighter';
const { spawn } = require('child_process');

const AI_PATH_PROD = getSharedResource('app.exe');
const AI_PATH_DEV = '<path to app.py>/app.py'; // path to app.py of the highlighter repository
const VENV_PATH = '<path to venv>/.venv/bin/python'; // path to python in virtual environment

export function getHighlighterProcess(videoUri: string) {
  const env = 'dev' as 'prod' | 'dev';

  if (env === 'dev') {
    return spawn(VENV_PATH, [AI_PATH_DEV, videoUri, '--ffmpeg_path', FFMPEG_EXE]);
  } else {
    return spawn(AI_PATH_PROD, [videoUri, '--ffmpeg_path', FFMPEG_EXE]);
  }
}

export function getTestData(videoUri: string): IHighlight[] {
  return null;
  // if (videoUri.includes('djnardi')) {
  //   console.log('Use djnardi test data');
  //   return JSON.parse(
  //     '[{"start_time":118.0,"end_time":null,"type":"deploy","origin":"deploy detection","start_timestamp":"00:01:58","end_timestamp":null},{"start_time":142.73,"end_time":null,"type":"kill","origin":"ocr crosshair, ocr lower","start_timestamp":"00:02:22","end_timestamp":null},{"start_time":245.73,"end_time":null,"type":"kill","origin":"ocr crosshair, ocr lower","start_timestamp":"00:04:05","end_timestamp":null}]',
  //   );
  // } else if (videoUri.includes('2024-07-18') || videoUri.includes('2024-07-22')) {
  //   console.log('Use other test data');
  //   return JSON.parse(
  //     '[{"start_time":0,"end_time":null,"type":"deploy","origin":"deploy detection","start_timestamp":"00:00:05","end_timestamp":null}]',
  //   );
  // } else if (videoUri.includes('stream.mp4')) {
  //   console.log('Use other test data');
  //   return JSON.parse(
  //     //   '[{"start_time": 568.0, "end_time": null, "type": "deploy", "origin": "deploy detection", "start_timestamp": "00:09:28", "end_timestamp": null}, {"start_time": 603.0, "end_time": null, "type": "kill", "origin": "ocr lower", "start_timestamp": "00:10:03", "end_timestamp": null}, {"start_time": 642.0, "end_time": null, "type": "kill", "origin": "ocr crosshair, ocr lower", "start_timestamp": "00:10:42", "end_timestamp": null}, {"start_time": 708.0, "end_time": null, "type": "kill", "origin": "ocr crosshair, ocr lower", "start_timestamp": "00:11:48", "end_timestamp": null}, {"start_time": 739.0, "end_time": null, "type": "kill", "origin": "ocr lower", "start_timestamp": "00:12:19", "end_timestamp": null}, {"start_time": 814.0, "end_time": null, "type": "kill", "origin": "ocr lower", "start_timestamp": "00:13:34", "end_timestamp": null}, {"start_time": 844.0, "end_time": null, "type": "kill", "origin": "ocr crosshair, ocr lower", "start_timestamp": "00:14:04", "end_timestamp": null}, {"start_time": 939.0, "end_time": null, "type": "kill", "origin": "ocr lower", "start_timestamp": "00:15:39", "end_timestamp": null}, {"start_time": 965.0, "end_time": null, "type": "kill", "origin": "ocr crosshair, ocr lower", "start_timestamp": "00:16:05", "end_timestamp": null}, {"start_time": 1105.0, "end_time": null, "type": "kill", "origin": "ocr crosshair, ocr lower", "start_timestamp": "00:18:25", "end_timestamp": null}, {"start_time": 1337.0, "end_time": null, "type": "kill", "origin": "ocr crosshair", "start_timestamp": "00:22:17", "end_timestamp": null}, {"start_time": 1491.0, "end_time": null, "type": "kill", "origin": "ocr crosshair, ocr lower", "start_timestamp": "00:24:51", "end_timestamp": null}, {"start_time": 1666.0, "end_time": null, "type": "kill", "origin": "ocr crosshair, ocr lower", "start_timestamp": "00:27:46", "end_timestamp": null}, {"start_time": 1691.0, "end_time": null, "type": "death", "origin": "death detection", "start_timestamp": "00:28:11", "end_timestamp": null}, {"start_time": 1691.0, "end_time": null, "type": "victory", "origin": "victory detection", "start_timestamp": "00:28:11", "end_timestamp": null}]',
  //     '[{"start_time": 1666.0, "end_time": null, "type": "kill", "origin": "ocr crosshair, ocr lower", "start_timestamp": "00:27:46", "end_timestamp": null}, {"start_time": 1691.0, "end_time": null, "type": "victory", "origin": "victory detection", "start_timestamp": "00:28:11", "end_timestamp": null}]',
  //   );
  // } else if (videoUri.includes('Kalti25')) {
  //   console.log('Use Kalti25 data');
  //   return JSON.parse(
  //     '[{"start_time": 568.0, "end_time": null, "type": "deploy", "origin": "deploy detection", "start_timestamp": "00:09:28", "end_timestamp": null}, {"start_time": 603.0, "end_time": null, "type": "kill", "origin": "ocr lower", "start_timestamp": "00:10:03", "end_timestamp": null}, {"start_time": 642.0, "end_time": null, "type": "kill", "origin": "ocr crosshair, ocr lower", "start_timestamp": "00:10:42", "end_timestamp": null}, {"start_time": 708.0, "end_time": null, "type": "kill", "origin": "ocr crosshair, ocr lower", "start_timestamp": "00:11:48", "end_timestamp": null}, {"start_time": 739.0, "end_time": null, "type": "kill", "origin": "ocr lower", "start_timestamp": "00:12:19", "end_timestamp": null}, {"start_time": 814.0, "end_time": null, "type": "kill", "origin": "ocr lower", "start_timestamp": "00:13:34", "end_timestamp": null}, {"start_time": 844.0, "end_time": null, "type": "kill", "origin": "ocr crosshair, ocr lower", "start_timestamp": "00:14:04", "end_timestamp": null}, {"start_time": 939.0, "end_time": null, "type": "kill", "origin": "ocr lower", "start_timestamp": "00:15:39", "end_timestamp": null}, {"start_time": 965.0, "end_time": null, "type": "kill", "origin": "ocr crosshair, ocr lower", "start_timestamp": "00:16:05", "end_timestamp": null}, {"start_time": 1105.0, "end_time": null, "type": "kill", "origin": "ocr crosshair, ocr lower", "start_timestamp": "00:18:25", "end_timestamp": null}, {"start_time": 1337.0, "end_time": null, "type": "kill", "origin": "ocr crosshair", "start_timestamp": "00:22:17", "end_timestamp": null}, {"start_time": 1491.0, "end_time": null, "type": "kill", "origin": "ocr crosshair, ocr lower", "start_timestamp": "00:24:51", "end_timestamp": null}, {"start_time": 1666.0, "end_time": null, "type": "kill", "origin": "ocr crosshair, ocr lower", "start_timestamp": "00:27:46", "end_timestamp": null},{"start_time": 1691.0, "end_time": null, "type": "victory", "origin": "victory detection", "start_timestamp": "00:28:11", "end_timestamp": null}]',
  //   );
  // }
}
