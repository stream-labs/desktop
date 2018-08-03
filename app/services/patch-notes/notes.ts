import { IPatchNotes } from '.';

export const notes: IPatchNotes = {
  version: '0.9.6',
  title: 'Improving Stability 🔧',
  showChest: false,
  notes: [
    'The focus of this patch is improving overall stability of the application. ' +
      'We have fixed a number of application crashes and are continuing to investigate ' +
      'and fix crashes going forward.',
    'Fixed an issue where the "Configure Video" button would not work ' +
      'for Elgato capture cards.',
    'Improved the performance of the source properties window and various settings inputs',
    'Fixed a bug where incorrect source names were displayed in the compressor filter settings'
  ]
};
