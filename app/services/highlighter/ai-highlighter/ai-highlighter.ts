import * as child from 'child_process';
import { getHighlighterProcess, getTestData } from './ai-utils';
import EventEmitter from 'events';

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
  metadata: { round: number };
}

export type EHighlighterMessageTypes =
  | 'progress'
  | 'inputs'
  | 'inputs_partial'
  | 'highlights'
  | 'highlights_partial';

export interface IHighlighterMessage {
  type: EHighlighterMessageTypes;
  json: {};
}
interface IHighlighterProgressMessage {
  progress: number;
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
      }
    }
    console.log('message not complete', this.buffer);
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
): Promise<IHighlight[]> {
  return new Promise((resolve, reject) => {
    console.log(`Get highlight clips for ${videoUri}`);

    const testData = getTestData(videoUri);
    if (testData) {
      resolve(testData);
    } else {
      let partialInputsRendered = false;
      console.log('Start Ai analysis');

      const childProcess: child.ChildProcess = mockChildProcess || getHighlighterProcess(videoUri);
      const messageBuffer = new MessageBufferHandler();

      if (cancelSignal) {
        cancelSignal.addEventListener('abort', () => {
          childProcess.kill();
          messageBuffer.clear();
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
          console.log('parsed aiHighlighterMessage', aiHighlighterMessage);

          if (typeof aiHighlighterMessage === 'string' || aiHighlighterMessage instanceof String) {
            console.log('message type of string', aiHighlighterMessage);
          } else if (aiHighlighterMessage) {
            console.log('message NOT type of string', aiHighlighterMessage);
            switch (aiHighlighterMessage.type) {
              case 'progress':
                progressUpdate?.(
                  (aiHighlighterMessage.json as IHighlighterProgressMessage).progress,
                );
                break;
              case 'highlights':
                if (!partialInputsRendered) {
                  console.log('call Render highlights:');
                  renderHighlights?.(aiHighlighterMessage.json as IHighlight[]);
                }
                resolve(aiHighlighterMessage.json as IHighlight[]);
                break;
              case 'highlights_partial':
                // Handle partial highlights if needed
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
        console.log('Error logs:', data.toString());
      });

      childProcess.on('error', error => {
        messageBuffer.clear();
        reject(new Error(`Child process threw an error. Error message: ${error.message}.`));
      });

      childProcess.on('exit', (code, signal) => {
        messageBuffer.clear();
        reject(new Error(`Child process exited with code ${code} and signal ${signal}`));
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
    } else {
      return messageString;
    }
  } catch (error: unknown) {
    console.log('Error parsing ai highlighter message:', error);
    return null;
  }
}

// Test function to simulate split messages from child process
export function testSplitMessages() {
  const messageBuffer = new MessageBufferHandler();

  // Simulate receiving split messages
  const message1 = 'Some logs>>>>{"type": "progress"';
  const message2 = ', "json": {"progress": 0.5}}<<<<More logs';

  console.log('Received first part:', message1);
  messageBuffer.appendToBuffer(message1);
  console.log('Message complete?', messageBuffer.isMessageComplete(message1));

  console.log('Received second part:', message2);
  messageBuffer.appendToBuffer(message2);
  console.log('Message complete?', messageBuffer.isMessageComplete(message2));

  const completeMessages = messageBuffer.extractCompleteMessages();
  console.log('Extracted complete message:', completeMessages);

  for (const completeMessage of completeMessages) {
    const parsed = parseAiHighlighterMessage(completeMessage);
    console.log('Parsed message:', parsed);
  }
}

// Mock function to simulate child process and data input
export async function simulateChildProcessData() {
  const mockChildProcess = new EventEmitter() as child.ChildProcess;
  mockChildProcess.stdout = new EventEmitter() as any;
  const abortController = new AbortController();

  getHighlightClips(
    'test_video_uri',
    highlights => {
      console.log('Rendered highlights:', highlights);
    },
    abortController.signal,
    progress => {
      console.log('Progress update:', progress);
    },
    mockChildProcess,
  );

  // Simulate receiving split messages
  const message1 = Buffer.from('>>>>{"type": "progress"');
  const message2 = Buffer.from(', "json": {"progress": 0.5}}<<<<');

  console.log('Simulating first part:', message1.toString());
  mockChildProcess.stdout.emit('data', message1);
  await new Promise(r => setTimeout(r, 4000));
  console.log('Simulating second part:', message2.toString());
  mockChildProcess.stdout.emit('data', message2);
}
