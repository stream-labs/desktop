import { ISourceDisplayData } from './index';
import { $t } from 'services/i18n';

const imageSupport = ['png', 'jpg', 'jpeg', 'gif', 'tga', 'bmp'];
const mediaSupport = [
  'mp4',
  'ts',
  'mov',
  'flv',
  'mkv',
  'avi',
  'mp3',
  'ogg',
  'aac',
  'wav',
  'gif',
  'webm',
];
const colorSupport = ['Hex', 'RGBA', 'HSV'];

export const SourceDisplayData = (): { [key: string]: ISourceDisplayData } => ({
  image_source: {
    name: $t('Image'),
    description: $t('Add images to your scene.'),
    demoFilename: 'image.png',
    supportList: imageSupport,
  },
  color_source: {
    name: $t('Color Source'),
    description: $t('Add a color to the background of your whole scene or just a part.'),
    demoFilename: 'color-source.png',
    supportList: colorSupport,
  },
  browser_source: {
    name: $t('Browser Source'),
    description: $t(
      'Allows you to add web-based content as a source, such as web pages, widgets, and streaming video.',
    ),
    demoFilename: 'browser-source.png',
    supportList: [$t('Websites'), $t('Third party widgets'), 'HTML'],
  },
  ffmpeg_source: {
    name: $t('Media Source'),
    description: $t('Add videos or sound clips to your scene.'),
    demoFilename: 'media.png',
    supportList: mediaSupport,
  },
  slideshow: {
    name: $t('Image Slide Show'),
    description: $t('Add a slideshow of images to your scene.'),
    demoFilename: 'image-slide-show.png',
    supportList: imageSupport,
  },
  text_gdiplus: {
    name: $t('Text (GDI+)'),
    description: $t('Add text to your scene and adjust its style.'),
    demoFilename: 'text.png',
    supportList: [...colorSupport, $t('System Fonts'), $t('System Sizes')],
  },
  monitor_capture: {
    name: $t('Display Capture'),
    description: $t('Capture your entire computer monitor.'),
    demoFilename: 'display-capture.png',
    supportList: [$t('Primary monitor'), $t('Secondary monitor')],
  },
  window_capture: {
    name: $t('Window Capture'),
    description: $t("Capture a specific window that's open on your computer."),
    demoFilename: 'window-capture.png',
    supportList: [$t('Compatible with most modern browsers and programs')],
  },
  game_capture: {
    name: $t('Game Capture'),
    description: $t("Capture a game you're playing on your computer."),
    demoFilename: 'game-capture.png',
    supportList: [$t('Built in works with most modern computer games')],
  },
  dshow_input: {
    name: $t('Video Capture Device'),
    description: $t('Display video from webcams, capture cards, and other devices.'),
    demoFilename: 'video-capture.png',
    supportList: [
      $t('Built in webcam'),
      $t('Logitech webcam'),
      $t('Capture cards (Elgato, Avermedia, BlackMagic)'),
    ],
  },
  ndi_source: {
    name: $t('NDI source'),
    description: $t('Allow you to capture NDI output streams.'),
  },
  'decklink-input': {
    name: $t('Blackmagic Device'),
    description: $t('Capture the feed your decklink device is capturing.'),
    demoFilename: 'sources.png',
    supportList: [$t('Works with most of the recent Blackmagic cards.')],
  },
  openvr_capture: {
    name: $t('OpenVR Capture'),
    description: $t('Directly capture the OpenVR monitoring video buffer of your HMD.'),
    demoFilename: 'vr-capture.png',
    supportList: ['OpenVR', 'SteamVR'],
  },
  screen_capture: {
    name: $t('Screen Capture'),
    description: $t('Capture from screen in a way you need'),
    demoFilename: 'vr-capture.png',
    supportList: [$t('Most games, apps, displays')],
  },
  liv_capture: {
    name: $t('LIV Client Capture'),
    description: $t(
      'Directly capture the LIV compositor output, reducing load and simplifying setup for Mixed Reality.',
    ),
    demoFilename: 'vr-capture.png',
    supportList: ['LIV'],
  },
  wasapi_input_capture: {
    name: $t('Audio Input Capture'),
    description: $t(
      'Any device that attaches to a computer for the purpose of capturing sound, such as music or speech.',
    ),
    demoFilename: 'audio-input.png',
    supportList: [$t('Built in microphones'), $t('USB microphones'), $t('Other USB devices')],
  },
  wasapi_output_capture: {
    name: $t('Audio Output Capture'),
    description: $t(
      'Captures your desktop audio for the purpose of playing sound, such as music or speech.',
    ),
    demoFilename: 'audio-output.png',
    supportList: [$t('Desktop audio')],
  },
  scene: {
    name: $t('Scene'),
    description: $t('Allows you to add existing scene as a source'),
    demoFilename: 'scene.png',
  },
  // vvv Not sure if this is still supported, there is no showcase data for it vvv
  text_ft2_source: {
    name: $t('Text (FreeType 2)'),
    description: '',
  },
  ovrstream_dc_source: {
    name: 'OvrStream',
    description: '',
  },
  vlc_source: {
    name: $t('VLC Source'),
    description: $t('Add playlists of videos to your scene.'),
  },
  coreaudio_input_capture: {
    name: $t('Audio Input Capture'),
    description: $t(
      'Any device that attaches to a computer for the purpose of capturing sound, such as music or speech.',
    ),
    demoFilename: 'audio-input.png',
    supportList: [$t('Built in microphones'), $t('USB microphones'), $t('Other USB devices')],
  },
  coreaudio_output_capture: {
    name: $t('Audio Output Capture'),
    description: $t(
      'Captures your desktop audio for the purpose of playing sound, such as music or speech.',
    ),
    demoFilename: 'audio-output.png',
    supportList: [$t('Desktop audio')],
  },
  av_capture_input: {
    name: $t('Video Capture Device'),
    description: $t('Display video from webcams, capture cards, and other devices.'),
    demoFilename: 'video-capture.png',
    supportList: [
      $t('Built in webcam'),
      $t('Logitech webcam'),
      $t('Capture cards (Elgato, Avermedia, BlackMagic)'),
    ],
  },
  display_capture: {
    name: $t('Display Capture'),
    description: $t('Capture your entire computer monitor.'),
    demoFilename: 'display-capture.png',
    supportList: [$t('Primary monitor'), $t('Secondary monitor')],
  },
  'syphon-input': {
    name: $t('Game Capture'),
    description: $t("Capture a game you're playing on your computer."),
    demoFilename: 'game-capture.png',
    supportList: [$t('Built in works with most modern computer games')],
  },
  audio_line: {
    name: $t('JACK Input Client'),
    description: $t(''),
  },
  soundtrack_source: {
    name: $t('Twitch Soundtrack'),
    description: $t(
      'Audio source working with the Twitch Soundtrack music application. Add this source to be able to filter out the music from your Twitch VODs.',
    ),
  },
});
