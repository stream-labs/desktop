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

export interface IHighlighterMessage {
  type: EHighlighterMessageTypes;
  json: {};
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
        // console.log('Ai highlighter message:', aiHighlighterMessage);
        if (typeof aiHighlighterMessage === 'string' || aiHighlighterMessage instanceof String) {
          console.log('\n\n');
          console.log('Python log:', aiHighlighterMessage);
          console.log('\n\n');
        } else {
          switch (aiHighlighterMessage?.type) {
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
        }
      });
      childProcess.stderr?.on('data', (data: string) => {
        // console.log('Error logs:', data.toString());
      });
    }
  });
}

function parseAiHighlighterMessage(messageString: string): IHighlighterMessage | string | null {
  try {
    if (messageString.includes('>>>>') && messageString.includes('<<<<')) {
      const start = messageString.indexOf('>>>>');
      const end = messageString.indexOf('<<<<');
      const jsonString = messageString.substring(start, end).replace('>>>>', '');
      console.log('Json string:', jsonString);

      const aiHighlighterMessage = JSON.parse(jsonString) as IHighlighterMessage;
      console.log('Parsed ai highlighter message:', aiHighlighterMessage);
      return aiHighlighterMessage;
      // if (!aiHighlighterMessage.type || !aiHighlighterMessage.json) {
      //   console.log('Invalid ai highlighter message:', aiHighlighterMessage);
      //   return null;
      // }
      // const parsedMessage = {
      //   type: aiHighlighterMessage.type,
      //   json: JSON.parse(aiHighlighterMessage.json),
      // };
      // console.log('Parsed message:', parsedMessage);

      // return parsedMessage;
    } else {
      return messageString;
    }
  } catch (error: unknown) {
    console.log('Error parsing ai highlighter message:', error);
    return null;
  }
}
