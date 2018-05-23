import { IPatchNotes } from '.';

export const notes: IPatchNotes = {
  version: '0.9.1',
  title: 'Introducing the Cloud',
  notes: [
    'Cloud Backups: Streamlabs OBS now backs up all of your scenes, sources, media, ' +
      "and overlay assets to the cloud.  Got a new computer?  Hard drive died?  Don't " +
      'worry, just log into Streamlabs OBS and your entire setup will be just as you left it.',
    'Added the ability to hide sources in the audio mixer',
    'Added horizontal and vertical centering options in the source transform menu',
    'Fixed a bug where the color picker would switch to a different color than what was selected',
    "Increased the height of the wheel widget so the bottom isn't cut off",
    'Fixed a bug where dragging sources would sometimes cause the source to drift away from the mouse cursor',
    'Fixed a bug where streaming for 24 hours caused the streaming clock to reset to 0',
    'Fixed an issue where game capture would cause performance issues with some games on the latest Windows 10 version'
  ]
};
