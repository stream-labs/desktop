import { IPatchNotes } from '.';

export const notes: IPatchNotes = {
  version: '0.9.3',
  title: 'Fixes and Tweaks',
  notes: [
    'You can now copy scenes and filters across scene collections',
    'Dragging and dropping or copy-pasting media, text, or URLs will now create a source of the appropriate type',
    'Source filters can now be reordered',
    'We updated translations for a handful of languages',
    'Fixed a bug where scene themes would import with multiple widgets of the same type',
    'Fixed a bug where switching scenes would sometimes end the stream',
    'Fixed a bug where media sources would sometimes revert to their old backed up media upon restarting the app',
    'Fixed a bug where streaming and recording at the same time using the QSV encoder was not working'
  ]
};
