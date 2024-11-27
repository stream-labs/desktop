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
        setCurrentClipIndex(prevIndex => (prevIndex + 1) % playlist.length);

        videoPlayer.current!.src = playlist[currentClipIndex].src;
        videoPlayer.current!.load();

        setTimeout(() => {
          isChangingClip.current = false;
        }, 500);
      }
    };

    const handleEnded = () => {
      nextClip();
    };

    const handlePause = () => {
      console.log('paused');
      // sometimes player fires paused event before ended, in this case we need to compare timestamps
      // and check if we are at the end of the clip
      const currentTime = videoPlayer.current!.currentTime;
      const endTime = playlist[currentClipIndex].end;

      console.log(currentTime, endTime);
      if (currentTime >= endTime || isRoughlyEqual(currentTime, endTime)) {
        console.log('switching clips');
        nextClip();
      }
    };

    const handlePlay = () => {
      console.log('playing');
      setIsPlaying(true);
    };

    videoPlayer.current?.addEventListener('ended', handleEnded);
    videoPlayer.current?.addEventListener('play', handlePlay);
    videoPlayer.current?.addEventListener('pause', handlePause);

    return () => {
      videoPlayer.current?.removeEventListener('ended', handleEnded);
      videoPlayer.current?.removeEventListener('play', handlePlay);
      videoPlayer.current?.removeEventListener('pause', handlePause);
    };
  }, [playlist.length]);

  useEffect(() => {
    if (videoPlayer.current === null || playlist.length === 0) {
      return;
    }
    videoPlayer.current!.src = playlist[currentClipIndex].src;
    videoPlayer.current!.load();
    videoPlayer.current!.play().catch(e => console.error('Error playing video:', e));
  }, [currentClipIndex]);

  function togglePlay() {
    const currentPlayer = videoPlayer.current;
    if (currentPlayer?.paused) {
      currentPlayer.play().catch(e => console.error('Error playing video:', e));
    } else {
      setIsPlaying(false);
      currentPlayer?.pause();
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
    videoPlayer.current!.src = playlist[index].src;
    videoPlayer.current!.load();
  }

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
