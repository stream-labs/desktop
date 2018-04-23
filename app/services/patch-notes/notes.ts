import { IPatchNotes } from '.';

export const notes: IPatchNotes = {
  version: '0.8.17',
  title: 'Projectors and Bugfixes',
  notes: [
    'Projectors: Right click on a source to pop out a preview of that source.  '
      + 'You can also pop out a preview of your streaming output.  All projectors can be made fullscreen.',
    'Filters can now be added to scenes, and they will be saved properly',
    'Switched from legacy to current Twitch chat.  Dark mode is not enabled by default in this chat.  If you ' +
      'want to use dark mode chat, you can click the gear in the lower left of the chat pane.',
    'The shift button can be used to select a range of sources',
    'Clicking the "Refresh Chat" button will now navigate back to the chat for your channel',
    'Navigating to a different tab in settings no longer moves the window',
    'Notifications settings will now save properly when exiting',
    'Allow reordering multiple sources at once'
  ]
};
