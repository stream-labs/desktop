import { IPatchNotes } from '.';

export const notes: IPatchNotes = {
  version: '0.22.0',
  title: 'Updated Internals',
  showChest: false,
  notes: [
    'Window capture now works on hardware accelerated windows such as Chrome and Discord',
    'Game capture now supports capturing games that use the Vulkan API',
    'Auto mode for game capture is now better than ever at automatically detecting games to capture',
    'The dynamic bitrate mode is smarter and less aggressive in lowering the bitrate',
    'We added a brand new flow for first-time Streamlabs OBS users',
    'Lots of bug and crash fixes',
  ],
};
