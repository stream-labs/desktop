import { IPatchNotes } from '.';

export const notes: IPatchNotes = {
  version: '0.11.2',
  title: 'Bug Fixes 🔧',
  showChest: false,
  notes: [
    'Fixed as issue that would sometimes result in a "Failed to load scene collection" message',
    'Fixed visual flickering in volmeters',
    'Fixed a source of crashes on Windows 7',
    'Fixed various input bugs in widget settings',
    'Added hotkey support for media hotkeys',
    'Fixed an issue that sometimes caused projectors to pop up as a white screen',
    'Fixed a bug that would cause sources to move while they are being cropped'
  ]
};
