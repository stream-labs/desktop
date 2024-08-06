import * as child from 'child_process';
import { getHighlighterProcess, getTestData } from './ai-utils';

export enum EHighlighterInputTypes {
  KILL = 'kill',
  GAME_SEQUENCE = 'game_sequence',
  VOICE_ACTIVITY = 'voice_activity',
  DEATH = 'death',
  VICTORY = 'victory',
  DEPLOY = 'deploy',
}

export interface IHighlighterInput {
  start_time: number;
  end_time?: number;
  type: EHighlighterInputTypes;
  origin: string;
}

export type EHighlighterMessageTypes = 'progress' | 'inputs';

interface IHighlighterMessage {
  type: EHighlighterMessageTypes;
  json: string;
}
interface IHighlighterProgressMessage {
  progress: number;
}

export function getHighlightClips(
  videoUri: string,
  progressUpdate?: (progress: number) => void,
): Promise<IHighlighterInput[]> {
  return new Promise((resolve, reject) => {
    console.log(`Get highlight clips for ${videoUri}`);

    const testData = getTestData(videoUri);
    if (testData) {
      resolve(testData);
    } else {
      console.log('Start Ai analysis');
      const childProcess: child.ChildProcess = getHighlighterProcess(videoUri);
      childProcess.stdout?.on('data', data => {
        const message = data.toString() as string;
        // console.log('Normal logs:', data.toString());
        const aiHighlighterMessage = parseAiHighlighterMessage(message);

        switch (aiHighlighterMessage.type) {
          case 'progress':
            progressUpdate((aiHighlighterMessage.json as IHighlighterProgressMessage).progress);
            break;
          case 'inputs':
            resolve(aiHighlighterMessage.json as IHighlighterInput[]);
            break;

          default:
            console.log('\n\n');
            console.log('Unrecognized message type:', aiHighlighterMessage);
            console.log('\n\n');

            break;
        }
      });
      childProcess.stderr?.on('data', (data: string) => {
        console.log('Error logs:', data.toString());
      });
    }
  });
}

function parseAiHighlighterMessage(
  messageString: string,
): { type: EHighlighterMessageTypes; json: unknown } | null {
  try {
    if (messageString.includes('>>>>') && messageString.includes('<<<<')) {
      const start = messageString.indexOf('>>>>');
      const end = messageString.indexOf('<<<<');
      const jsonString = messageString.substring(start, end).replace('>>>>', '');
      const aiHighlighterMessage = JSON.parse(jsonString) as IHighlighterMessage;
      const parseMessage = {
        type: aiHighlighterMessage.type,
        json: JSON.parse(aiHighlighterMessage.json),
      };
    }
  } catch (error: unknown) {
    console.log('Error parsing ai highlighter message:', error);
    return null;
  }
}
