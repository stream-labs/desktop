import { IPatchNotes } from '.';

export const notes: IPatchNotes = {
  version: '0.15.0',
  title: 'Travel Back in Time',
  showChest: false,
  notes: [
    'Added undo/redo functionality - Ctrl+Z to Undo an action and Ctrl + Y to Redo. ' +
      'Arrows in the top right now indicate undo and redo state',
    'Added a search bar to the hotkey settings menu',
    'Added an option to re import from OBS (accessible from the scene collection manager and the general settings)',
    'Improved sliders across the application',
    'Fixed a handful of bugs and crashes',
  ],
};
