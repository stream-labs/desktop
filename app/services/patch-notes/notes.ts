import { IPatchNotes } from '.';

export const notes: IPatchNotes = {
  version: '0.11.9',
  title: 'Settings and Bug Fixes',
  showChest: false,
  notes: [
    'Added auto reconnect stream settings',
    'Added IP binding',
    'Added Browser source acceleration',
    'Added a new setting to set SLOBS to run on the GPU or CPU: this option requires a restart of the app',
    'Added the ability to schedule streams for Facebook and Youtube',
    'Added Game Capture hotkeys',
    'Added custom output resolution in advanced output settings',
    'Added the possibility to change some stream settings directly from the dropped frames notification',
    'Fixed Audio Monitoring device not working correctly',
    'Fixed a crash on startup when the Chinese language is selected',
    'Fixed duplicated audio device id',
    'Fixed SLOBS crashing on startup if the facemask plugin failed to load',
    'Fixed lossless video recording quality not working',
    'Fixed Snapping settings resetting when restarting SLOBS',
    'Fixed an issue where Facebook Live users could not use a custom streaming server',
    'Fixed an issue where Facebook Live users could not go live if they had the stream info window disabled',
    'And many more bug and stability fixes',
  ],
};
