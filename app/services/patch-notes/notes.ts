import { IPatchNotes } from '.';

export const notes: IPatchNotes = {
  version: '0.11.4',
  title: 'Bug Fixes and Stability',
  showChest: false,
  notes: [
    'Added Alert box settings directly integrated into source properties',
    'Crash-handler: Added a new module that will monitor the application processes ' +
      'in order to have the possibility to not end the stream when certain crashes occur',
    'Fixed some memory leaks',
    'Fixed an issue where recording quality was not correctly applied in some cases',
    'Added "Same as stream" option in advanced output recording settings',
    'Fixed importing advanced audio settings from OBS',
    'Fixed empty server list which switching from a service type to another',
    'Fixed some application crashes on shutdown',
    'Fixed a potential source of crashes on startup',
    'Updated the browser source to utilize hardware acceleration',
    'Fixed the notification system reporting wrong values for skipped and lagged frames values in some cases',
    'Fixed an issue where streaming would not start in some cases'
  ]
};
