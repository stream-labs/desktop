import path from 'path';
import {
  AVAILABLE_TRANSITIONS,
  EExportStep,
  IAudioInfo,
  IExportInfo,
  IExportOptions,
  ITransitionInfo,
  transitionParams,
} from '../models/rendering.models';
import { AudioCrossfader } from './audio-crossfader';
import { AudioMixer } from './audio-mixer';
import { RenderingClip } from './rendering-clip';
import { Transitioner } from './transitioner';
import { FrameWriter } from './frame-writer';
import { HighlighterError } from './errors';
import { $t } from '../../i18n';
import * as Sentry from '@sentry/browser';
import { sample } from 'lodash';
import { TAnalyticsEvent } from '../../usage-statistics';

export interface IRenderingConfig {
  renderingClips: RenderingClip[];
  isPreview: boolean;
  exportInfo: IExportInfo;
  exportOptions: IExportOptions;
  audioInfo: IAudioInfo;
  transitionDuration: number;
  transition: ITransitionInfo;
  useAiHighlighter: boolean;
  streamId: string | undefined;
}
export async function startRenderingNew(
  renderingConfig: IRenderingConfig,
  handleFrame: (currentFrame: number) => void,
  setExportInfo: (partialExportInfo: Partial<IExportInfo>) => void,
  recordAnalyticsEvent: (type: TAnalyticsEvent, data: Record<string, unknown>) => void,
) {
  const renderingClips = renderingConfig.renderingClips;
  const isPreview = renderingConfig.isPreview;
  const exportInfo = renderingConfig.exportInfo;
  const exportOptions = renderingConfig.exportOptions;
  const audioInfo = renderingConfig.audioInfo;
  const transitionDuration = renderingConfig.transitionDuration;
  const transition = renderingConfig.transition;
  const useAiHighlighter = renderingConfig.useAiHighlighter;
  const streamId = renderingConfig.streamId;

  let fader: AudioCrossfader | null = null;
  let mixer: AudioMixer | null = null;
  try {
    // Estimate the total number of frames to set up export info
    const totalFrames = renderingClips.reduce((count: number, clip) => {
      return count + clip.frameSource.nFrames;
    }, 0);
    const numTransitions = renderingClips.length - 1;
    const transitionFrames = transitionDuration * exportOptions.fps;
    const totalFramesAfterTransitions = totalFrames - numTransitions * transitionFrames;

    setExportInfo({
      totalFrames: totalFramesAfterTransitions,
    });

    let currentFrame = 0;

    // Mix audio first
    await Promise.all(
      renderingClips.filter(c => c.hasAudio).map(clip => clip.audioSource.extract()),
    );
    const parsed = path.parse(exportInfo.file);
    const audioConcat = path.join(parsed.dir, `${parsed.name}-concat.flac`);
    let audioMix = path.join(parsed.dir, `${parsed.name}-mix.flac`);
    fader = new AudioCrossfader(audioConcat, renderingClips, transitionDuration);
    await fader.export();

    if (audioInfo.musicEnabled && audioInfo.musicPath) {
      mixer = new AudioMixer(audioMix, [
        { path: audioConcat, volume: 1, loop: false },
        {
          path: audioInfo.musicPath,
          volume: Math.pow(10, -1 + audioInfo.musicVolume / 100),
          loop: true,
        },
      ]);

      await mixer.export();
    } else {
      // If there's no background music, we can skip mix entirely and just
      // use the concatenated clip audio directly.
      audioMix = audioConcat;
    }

    await Promise.all(renderingClips.map(clip => clip.audioSource.cleanup()));
    const nClips = renderingClips.length;

    setExportInfo({ step: EExportStep.FrameRender });

    ffmpegConcat({
      args: ['-c:v', 'libx264', '-i', audioMix, '-crf', '23', '-vf', 'subtitles=media/color.ass'],
      output: 'test.mp4',
      videos: ['media/video1.mp4', 'media/video2.mp4', 'media/video1.mp4'],
      transitions: [
        {
          name: 'cube',
          duration: 500,
        },
        {
          name: '',
          duration: 500,
        },
      ],
    });

    // Render with our without transitions
  } catch (error: unknown) {
    console.error(error);

    Sentry.withScope(scope => {
      scope.setTag('feature', 'highlighter');
      console.error('Highlighter export error', error);
    });

    if (error instanceof HighlighterError) {
      setExportInfo({ error: error.userMessage });
      recordAnalyticsEvent(useAiHighlighter ? 'AIHighlighter' : 'Highlighter', {
        type: 'ExportError',
        error: error.constructor.name,
      });
    } else {
      setExportInfo({ error: $t('An error occurred while exporting the video') });

      recordAnalyticsEvent(useAiHighlighter ? 'AIHighlighter' : 'Highlighter', {
        type: 'ExportError',
        error: 'Unknown',
      });
    }
  } finally {
    setExportInfo({
      exporting: false,
      exported: !exportInfo.cancelRequested && !isPreview && !exportInfo.error,
    });

    if (fader) await fader.cleanup();
    if (mixer) await mixer.cleanup();
  }
}
