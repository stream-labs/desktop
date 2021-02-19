import { IPatchNotes } from '.';

export const notes: IPatchNotes = {
  version: '0.27.0',
  title: 'Visual Filter Presets',
  showChest: false,
  notes: [
    'Added preset filters to the filter menu for non-audio sources',
    'Fixed compatability issues with users on MacOS Big Sur',
    'Added Viewer Count widget for Facebook users',
    'Added a thumbnail uploader for YouTube users',
    'Added Streamlabs Charity Goal widget',
    'Refactored audio volmeters to respond at 60fps',
    'Redesigned and condensed the Advanced Audio window',
    'Fixed a bug in Edit Transform position with negative values',
    'Fixed a bug related to chat zoom while multistreaming',
  ],
};
