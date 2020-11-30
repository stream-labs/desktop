import { IPatchNotes } from '.';

export const notes: IPatchNotes = {
  version: '0.26.0',
  title: 'Update to Electron 9',
  showChest: false,
  notes: [
    'Updated frontend system architecture to Electron 9',
    'Revamped the Go Live flow for Facebook users and multistreamers',
    'Moved Login/Logout to the Settings Window',
    'Added Follower Goals for Facebook users',
    'Updated the Custom Resolution input for easier use',
    'Fixed a bug related to keyboard shortcuts in the Edit Transform Window',
    'Fixed a bug where the Scenes list appeared empty in some layouts',
    'Fixed a bug loading Alert Box settings with a merged account',
  ],
};
