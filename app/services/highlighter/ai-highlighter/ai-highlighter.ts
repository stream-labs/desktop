import * as child from 'child_process';
import EventEmitter from 'events';
import { AiHighlighterUpdater } from './updater';
import { duration } from 'moment';
import { ICoordinates } from '..';
import kill from 'tree-kill';

export enum EHighlighterInputTypes {
  KILL = 'kill',
  KNOCKED = 'knocked',
  GAME_SEQUENCE = 'game_sequence',
  GAME_START = 'start_game',
  GAME_END = 'end_game',
  VOICE_ACTIVITY = 'voice_activity',
  DEATH = 'death',
  VICTORY = 'victory',
  DEPLOY = 'deploy',
  META_DURATION = 'meta_duration',
  LOW_HEALTH = 'low_health',
  PLAYER_KNOCKED = 'player_knocked',
}
export type DeathMetadata = {
  place: number;
};
export interface IHighlighterInput {
  start_time: number;
  end_time?: number;
  type: EHighlighterInputTypes;
  origin: string;
  metadata?: DeathMetadata | any;
}
export interface IHighlight {
  start_time: number;
  end_time: number;
  input_types: EHighlighterInputTypes[];
  inputs: IHighlighterInput[];
  score: number;
  metadata: { round: number; webcam_coordinates: ICoordinates };
}

export type EHighlighterMessageTypes =
  | 'progress'
  | 'inputs'
  | 'inputs_partial'
  | 'highlights'
  | 'milestone';

export interface IHighlighterMessage {
  type: EHighlighterMessageTypes;
  json: {};
}
interface IHighlighterProgressMessage {
  progress: number;
}

export interface IHighlighterMilestone {
  name: string;
  weight: number;
  data: IHighlighterMessage[] | null;
}

// Buffer management class to handle split messages
class MessageBufferHandler {
  private buffer: string = '';
  private readonly startToken: string = '>>>>';
  private readonly endToken: string = '<<<<';

  hasCompleteMessage(): boolean {
    const hasStart = this.buffer.includes(this.startToken);
    const hasEnd = this.buffer.includes(this.endToken);
    return hasStart && hasEnd;
  }

  isMessageComplete(message: string): boolean {
    const combined = this.buffer + message;
    const hasStart = combined.includes(this.startToken);
    const hasEnd = combined.includes(this.endToken);
    return hasStart && hasEnd;
  }

  appendToBuffer(message: string) {
    this.buffer += message;
  }

  extractCompleteMessages(): string[] {
    const messages = [];
    while (this.hasCompleteMessage()) {
      const start = this.buffer.indexOf(this.startToken);
      const end = this.buffer.indexOf(this.endToken);

      if (start !== -1 && end !== -1 && start < end) {
        const completeMessage = this.buffer.substring(start, end + this.endToken.length);
        // Clear the buffer of the extracted message
        this.buffer = this.buffer.substring(end + this.endToken.length);
        messages.push(completeMessage);
      } else {
        // Message not complete
      }
    }
    return messages;
  }

  clear() {
    this.buffer = '';
  }
}

export function getHighlightClips(
  videoUri: string,
  renderHighlights: (highlightClips: IHighlight[]) => void,
  cancelSignal: AbortSignal,
  progressUpdate?: (progress: number) => void,
  mockChildProcess?: child.ChildProcess,
  milestonesPath?: string,
  milestoneUpdate?: (milestone: IHighlighterMilestone) => void,
): Promise<IHighlight[]> {
  return new Promise((resolve, reject) => {
    console.log(`Get highlight clips for ${videoUri}`);

    const partialInputsRendered = false;
    console.log('Start Ai analysis');

    const childProcess: child.ChildProcess =
      mockChildProcess || AiHighlighterUpdater.startHighlighterProcess(videoUri, milestonesPath);
    const messageBuffer = new MessageBufferHandler();

    if (cancelSignal) {
      cancelSignal.addEventListener('abort', () => {
        console.log('ending highlighter process');
        messageBuffer.clear();
        kill(childProcess.pid, 'SIGINT');
        reject(new Error('Highlight generation canceled'));
      });
    }

    childProcess.stdout?.on('data', (data: Buffer) => {
      const message = data.toString();
      messageBuffer.appendToBuffer(message);

      // Try to extract a complete message
      const completeMessages = messageBuffer.extractCompleteMessages();

      for (const completeMessage of completeMessages) {
        // messageBuffer.clear();
        const aiHighlighterMessage = parseAiHighlighterMessage(completeMessage);
        if (typeof aiHighlighterMessage === 'string' || aiHighlighterMessage instanceof String) {
          console.log('message type of string', aiHighlighterMessage);
        } else if (aiHighlighterMessage) {
          switch (aiHighlighterMessage.type) {
            case 'progress':
              progressUpdate?.((aiHighlighterMessage.json as IHighlighterProgressMessage).progress);
              break;
            case 'highlights':
              if (!partialInputsRendered) {
                console.log('call Render highlights:');
                renderHighlights?.(aiHighlighterMessage.json as IHighlight[]);
              }
              resolve(aiHighlighterMessage.json as IHighlight[]);
              break;
            case 'milestone':
              milestoneUpdate?.(aiHighlighterMessage.json as IHighlighterMilestone);
              break;
            default:
              console.log('\n\n');
              console.log('Unrecognized message type:', aiHighlighterMessage);
              console.log('\n\n');
              break;
          }
        }
      }
    });

    childProcess.stderr?.on('data', (data: Buffer) => {
      console.log('Debug logs:', data.toString());
    });

    childProcess.on('error', error => {
      messageBuffer.clear();
      reject(new Error(`Child process threw an error. Error message: ${error.message}.`));
    });

    childProcess.on('exit', (code, signal) => {
      messageBuffer.clear();
      reject(new Error(`Child process exited with code ${code} and signal ${signal}`));
    });
  });
}

function parseAiHighlighterMessage(messageString: string): IHighlighterMessage | string | null {
  try {
    if (messageString.includes('>>>>') && messageString.includes('<<<<')) {
      const start = messageString.indexOf('>>>>');
      const end = messageString.indexOf('<<<<');
      const jsonString = messageString.substring(start, end).replace('>>>>', '');
      // console.log('Json string:', jsonString);

      const aiHighlighterMessage = JSON.parse(jsonString) as IHighlighterMessage;
      // console.log('Parsed ai highlighter message:', aiHighlighterMessage);
      return aiHighlighterMessage;
    } else {
      return messageString;
    }
  } catch (error: unknown) {
    console.log('Error parsing ai highlighter message:', error);
    return null;
  }
}

export class ProgressTracker {
  PRE_DURATION = 10;
  POST_DURATION = 10;
  progress = 0;

  onChangeCallback: (progress: number) => void;

  preInterval: NodeJS.Timeout;
  postInterval: NodeJS.Timeout;
  postStarted = false;
  constructor(onChange = (progress: number) => {}) {
    this.startPreTimer();
    this.onChangeCallback = onChange;
  }

  startPreTimer() {
    this.progress = 0;
    this.preInterval = this.addOnePerSecond(this.PRE_DURATION);
  }

  startPostTimer() {
    if (!this.postStarted) {
      this.postInterval = this.addOnePerSecond(this.POST_DURATION);
      this.postStarted = true;
    }
  }
  destroy() {
    this.preInterval && clearInterval(this.preInterval);
    this.postInterval && clearInterval(this.postInterval);
  }

  updateProgressFromHighlighter(highlighterProgress: number) {
    this.preInterval && clearInterval(this.preInterval);
    const adjustedProgress =
      highlighterProgress * ((100 - this.PRE_DURATION - this.POST_DURATION) / 100) +
      this.PRE_DURATION;

    this.progress = adjustedProgress;
    this.onChangeCallback(this.progress);
    if (highlighterProgress === 100) {
      this.startPostTimer();
    }
  }

  addOnePerSecond(duration: number) {
    let passedSeconds = 0;
    const interval = setInterval(() => {
      passedSeconds += 1;
      this.progress += 1;
      this.onChangeCallback(this.progress);
      if (passedSeconds >= duration) {
        clearInterval(interval);
      }
    }, 1000);
    return interval;
  }
}
