import { IPatchNotes } from '.';

export const notes: IPatchNotes = {
  version: '0.11.0',
  title: 'Cloud Chatbot, Face Masks, and more!',
  showChest: true,
  notes: [
    'We are releasing a new chatbot that runs in the cloud and is fully integrated into Streamlabs OBS. ' +
      'This feature is being rolled out slowly, so keep an eye out for it over the coming days.',
    'Face masks are here!  Your viewers can put a variety of funny masks on your face on stream directly ' +
      'from your donation page.  Keep an eye on the dashboard as we roll this feature out.',
    'Added support for FrankerFaceZ settings',
    'Added integrated settings for Sub Goal and Media Share widgets',
    'Re-enabled the QSV encoder',
    'Fixed advanced AMD settings not saving properly',
    'Fixed an issue where the OBS importer would sometimes not correctly import'
  ]
};
