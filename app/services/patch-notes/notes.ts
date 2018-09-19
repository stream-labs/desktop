import { IPatchNotes } from '.';

export const notes: IPatchNotes = {
  version: '0.10.3',
  title: 'Various fixes and integrated Widgets',
  showChest: false,
  notes: [
    'Rewrite of how our Backend communicates with OBS',
    'Many widgets\' settings can now be edited directly in-window instead of navigating to the Streamlabs dashboard',
    'Fixed browser source not being able to play a certain type of files',
    'Set SLOBS to run on NVIDIA GPU (when available)',
    'Improved flickering issues when opening child windows',
    'Fixed multiple instances of video encoder creation when using the same video encoder to stream and record : could cause high CPU usage / lagged frames',
    'Fixed flickering when creating the displays',
    'Various style/padding fixes',
    'Fixed wrong encoders IDs when importing from OBS',
    'Fixed wrong default server when importing from OBS',
    'Temporarily disabled the QSV encoder as it\'s causing a crash on start streaming on some cases. The QSV encoder will be renabled once the issue is fixed',
    'Renamed a background process to workaround certain devices not capturing audio, most notably certain capture cards and audio centers',
    'Added unicode support in the install path directory',
    'Fixed stream not correctly reconnecting itself in some cases after a disconnection occurred',
    'Fixed game capture not capturing in some cases'
  ]
};
