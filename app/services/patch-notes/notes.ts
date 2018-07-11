import { IPatchNotes } from '.';

export const notes: IPatchNotes = {
  version: '0.9.4',
  title: 'Transitions Overhaul',
  notes: [
    "We've completely overhauled transitions from the ground up. You can create as many transitions as you want, " +
      'and set up connections to automatically use certain transitions between scenes of your choice.',
    'Added a confirmation dialog when deleting sources',
    'Fixed an issue where the active scene collection would be changed when restoring from cloud backup',
    'Fixed an issue where animated gifs were not properly restored from cloud backup',
    'Fixed an issue where logging into a different account would still display chat for the previous account',
    'Fixed some crashes relating to the SLOBS chat window and starting a raid'
  ]
};
