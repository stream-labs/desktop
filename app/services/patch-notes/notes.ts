import { IPatchNotes } from '.';

export const notes: IPatchNotes = {
  version: '0.11.1',
  title: 'New Widget Settings, Bug Fixes 🔧',
  showChest: false,
  notes: [
    'Improved the design of widget settings windows',
    'Fixed stream settings not correctly saving when unicode is present in the username',
    'Fixed bitrate/settings visually not changing when going live',
    'Fixed optimized game encoder not being detected in certain cases ',
    'Fixed a potential crash when ending the stream',
    'Fixed adding new transition properties window when changing transition type',
    'Fixed scene collections failing to load and being erased in some cases',
    'Fixed projectors showing a titlebar when in fullscreen',
    'Fixed an issue where you could not duplicate a scene',
    'Improve overall application responsiveness (most notably in loading scene collections)'
  ]
};
