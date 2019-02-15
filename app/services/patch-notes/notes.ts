import { IPatchNotes } from '.';

export const notes: IPatchNotes = {
  version: '0.11.12',
  title: 'Replay Buffer & Smart Video Encoding',
  showChest: false,
  notes: [
    'The replay buffer will continously record the latest moments of your stream, and can be saved ' +
      'with the press of a hotkey. You can enable this feature in the Advanced Settings tab.',
    'Added our game-aware video encoding optimizations to reduce the CPU/GPU usage and improve ' +
      'the video quality of your streams. Currently 65 games are supported and it works with most encoders.',
  ],
};
