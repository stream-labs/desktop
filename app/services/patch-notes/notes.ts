import { IPatchNotes } from '.';

export const notes: IPatchNotes = {
  version: '0.9.2',
  title: 'Now Streaming in 14 Languages',
  notes: [
    "We've been working with a team of international streamers to translate Streamlabs OBS " +
      'into as many different languages as possible.  Today we are launching with 14 different ' +
      'languages with more on the way.  You can find a language selector in Settings => General. ' +
      'Please bear with us as we continue to improve and complete our translations',
    'Our audio mixer has been given an overhaul with new multi-channel ' +
      'volume level displays, as well as color coded zones to help you dial in the perfect volume.',
    'You can now pop out the recent events view on the live page into a separate window',
    'Video files for stinger transitions will now be backed up in the cloud',
    'Added a confirmation when removing scenes via right click',
    'Fixed a bug where text sources would not import properly from the theme library',
    'Fixed a bug that caused the cloud sync icon to not properly show while syncing in some scenarios'
  ]
};
