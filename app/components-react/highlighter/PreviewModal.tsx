import React, { useEffect, useRef, useState } from 'react';
import { Services } from 'components-react/service-provider';
import { $t } from 'services/i18n';
import { TClip } from 'services/highlighter';
import { sortClipsByOrder } from './utils';
import MiniClipPreview from './MiniClipPreview';
import { PauseButton, PlayButton } from './StreamCard';

export default function PreviewModal({
  close,
  streamId,
}: {
  close: () => void;
  streamId: string | undefined;
}) {
  if (streamId === undefined) {
    throw new Error('streamId is required');
  }
  const { HighlighterService } = Services;
  const clips = HighlighterService.getClips(HighlighterService.views.clips, streamId);
  const { intro, outro } = HighlighterService.views.video;
  const audioSettings = HighlighterService.views.audio;
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const sortedClips = [...sortClipsByOrder(clips, streamId).filter(c => c.enabled)];

  const playlist = [
    ...(intro.duration
      ? [
          {
            src: intro.path,
            path: intro.path,
            start: 0,
            end: intro.duration!,
            type: 'video/mp4',
          },
        ]
      : []),
    ...sortedClips.map((clip: TClip) => ({
      src: clip.path + `#t=${clip.startTrim},${clip.duration! - clip.endTrim}`,
      path: clip.path,
      start: clip.startTrim,
      end: clip.duration! - clip.endTrim,
      type: 'video/mp4',
    })),
    ...(outro.duration && outro.path
      ? [
          {
            src: outro.path,
            path: outro.path,
            start: 0,
            end: outro.duration!,
            type: 'video/mp4',
          },
        ]
      : []),
  ];
  const videoPlayer = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const isChangingClip = useRef(false);
  const [isPlaying, setIsPlaying] = useState(true);

  function isRoughlyEqual(a: number, b: number, tolerance: number = 0.3): boolean {
    return Math.abs(a - b) <= tolerance;
  }

  useEffect(() => {
    //Pause gets also triggered when the video ends. We dont want to change the clip in that case
    const nextClip = () => {
      if (!isChangingClip.current) {
        isChangingClip.current = true;

        setCurrentClipIndex(prevIndex => {
          const newIndex = (prevIndex + 1) % playlist.length;

          videoPlayer.current!.src = playlist[currentClipIndex].src;
          videoPlayer.current!.load();

          if (newIndex === 0) {
            audio.current!.currentTime = 0;
            audio.current!.play().catch(e => console.error('Error playing audio:', e));
          }

          return newIndex;
        });

        setTimeout(() => {
          isChangingClip.current = false;
        }, 500);
      }
    };

    const handleEnded = () => {
      nextClip();
    };

    const handlePause = () => {
      // sometimes player fires paused event before ended, in this case we need to compare timestamps
      // and check if we are at the end of the clip
      const currentTime = videoPlayer.current!.currentTime;
      const endTime = playlist[currentClipIndex].end;

      if (currentTime >= endTime || isRoughlyEqual(currentTime, endTime)) {
        nextClip();
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    videoPlayer.current?.addEventListener('ended', handleEnded);
    videoPlayer.current?.addEventListener('play', handlePlay);
    videoPlayer.current?.addEventListener('pause', handlePause);

    if (audioSettings.musicEnabled && audioSettings.musicPath) {
      audio.current = new Audio(audioSettings.musicPath);
      audio.current.volume = audioSettings.musicVolume / 100;
      audio.current.autoplay = true;
    }

    return () => {
      videoPlayer.current?.removeEventListener('ended', handleEnded);
      videoPlayer.current?.removeEventListener('play', handlePlay);
      videoPlayer.current?.removeEventListener('pause', handlePause);
      if (audio.current) {
        audio.current.pause();
        audio.current = null;
      }
    };
  }, [playlist.length]);

  useEffect(() => {
    if (videoPlayer.current === null || playlist.length === 0) {
      return;
    }
    videoPlayer.current!.src = playlist[currentClipIndex].src;
    videoPlayer.current!.load();
    videoPlayer.current!.play().catch(e => console.error('Error playing video:', e));

    // currently its done by querying DOM, don't want to store a giant array of refs
    // that wont be used otherwise
    document.getElementById('preview-' + currentClipIndex)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    });
  }, [currentClipIndex]);

  function togglePlay() {
    const currentPlayer = videoPlayer.current;
    if (currentPlayer?.paused) {
      currentPlayer.play().catch(e => console.error('Error playing video:', e));
      if (audio.current!.currentTime > 0) {
        audio.current?.play().catch(e => console.error('Error playing audio:', e));
      }
    } else {
      setIsPlaying(false);
      currentPlayer?.pause();
      audio.current?.pause();
    }
  }

  function playPauseButton() {
    if (isPlaying) {
      return <PauseButton />;
    } else {
      return <PlayButton />;
    }
  }

  function jumpToClip(index: number) {
    if (currentClipIndex === index) {
      return;
    }

    setCurrentClipIndex(index);
    const clip = playlist[index];
    videoPlayer.current!.src = clip.src;
    videoPlayer.current!.load();

    // clips don't have absolute timestamps, we need to calculate the start time
    // in relation to previous clips
    const startTime = playlist
      .filter((_, i) => i < index)
      .reduce((acc, curr) => acc + (curr.end - curr.start), 0);

    if (startTime < audio.current!.duration) {
      audio.current!.currentTime = startTime;
      audio.current!.play().catch(e => console.error('Error playing audio:', e));
    } else {
      // when we jump to clip and background music ends, we need to pause it
      // to prevent it from being played from 0
      audio.current!.currentTime = 0;
      audio.current?.pause();
    }
  }

  const handleScroll = (event: { deltaY: any }) => {
    if (containerRef.current) {
      containerRef.current.scrollLeft += event.deltaY;
    }
  };

  return (
    <div>
      <h2>{$t('Preview')}</h2>
      <p>
        This is just a preview of your highlight reel. Loading times between clips are possible.
      </p>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
        <video
          onClick={togglePlay}
          ref={videoPlayer}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
      </div>
      <div style={{ display: 'flex', marginTop: '16px' }}>
        <div style={{ cursor: 'pointer' }} onClick={() => togglePlay()}>
          {playPauseButton()}
        </div>
        <div
          ref={containerRef}
          onWheel={handleScroll}
          style={{
            width: '100%',
            paddingLeft: '8px',
            paddingRight: '8px',
            display: 'flex',
            overflowX: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '4px',
              paddingBottom: '8px',
              justifyContent: 'center',
            }}
          >
            {playlist.map(({ path }, index) => {
              let content;
              if (path === intro.path || path === outro.path) {
                content = (
                  <div style={{ height: '34px' }}>
                    <video
                      id={'preview-' + index}
                      style={{ height: '100%' }}
                      src={path}
                      controls={false}
                      autoPlay={false}
                      muted
                      playsInline
                    ></video>
                  </div>
                );
              } else {
                content = <MiniClipPreview clipId={path}></MiniClipPreview>;
              }

              return (
                <div
                  key={'preview-mini' + index}
                  id={'preview-' + index}
                  style={{
                    cursor: 'pointer',
                    borderRadius: '6px',
                    width: 'fit-content',
                    border: `solid 2px ${currentClipIndex === index ? 'white' : 'transparent'}`,
                  }}
                  onClick={() => {
                    jumpToClip(index);
                  }}
                >
                  {content}
                </div>
              );
            })}
          </div>
        </div>{' '}
      </div>
    </div>
  );
}
