import { useVuex } from 'components-react/hooks';
import React, { useEffect, useRef, useState } from 'react';
import { Services } from 'components-react/service-provider';
import { $t } from 'services/i18n';
import { TClip } from 'services/highlighter';
import { sortClips } from './utils';
import MiniClipPreview from './MiniClipPreview';
import Scrollable from 'components-react/shared/Scrollable';
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
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const sortedClips = sortClips(clips, streamId).filter(c => c.enabled);

  const playlist = sortedClips.map((clip: TClip) => ({
    src: clip.path + `#t=${clip.startTrim},${clip.duration! - clip.endTrim}`,
    start: clip.startTrim,
    end: clip.duration! - clip.endTrim,
    type: 'video/mp4',
  }));
  const videoPlayerA = useRef<HTMLVideoElement>(null);
  const videoPlayerB = useRef<HTMLVideoElement>(null);
  const [activePlayer, setActivePlayer] = useState<'A' | 'B'>('A');
  const isChangingClip = useRef(false);
  const [isPlaying, setIsPlaying] = useState(true);

  function isOdd(num: number): boolean {
    return num % 2 === 1;
  }
  function isRoughlyEqual(a: number, b: number, tolerance: number = 0.2): boolean {
    return Math.abs(a - b) <= tolerance;
  }
  useEffect(() => {
    //Pause gets also triggered when the video ends. We dont want to change the clip in that case
    const nextClip = () => {
      if (!isChangingClip.current) {
        isChangingClip.current = true;
        setCurrentClipIndex(prevIndex => (prevIndex + 1) % playlist.length);

        setTimeout(() => {
          isChangingClip.current = false;
        }, 500);
      }
    };
    const handleEnded = () => {
      nextClip();
    };

    const handlePause = () => {
      const currentPlayer = activePlayer === 'A' ? videoPlayerA.current : videoPlayerB.current;
      if (!currentPlayer) {
        return;
      }
      if (
        currentPlayer.currentTime > playlist[currentClipIndex].end ||
        isRoughlyEqual(currentPlayer.currentTime, playlist[currentClipIndex].end)
      ) {
        nextClip();
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    videoPlayerA.current?.addEventListener('ended', handleEnded);
    videoPlayerB.current?.addEventListener('ended', handleEnded);
    videoPlayerA.current?.addEventListener('play', handlePlay);
    videoPlayerB.current?.addEventListener('play', handlePlay);
    videoPlayerA.current?.addEventListener('pause', handlePause);
    videoPlayerB.current?.addEventListener('pause', handlePause);

    return () => {
      videoPlayerA.current?.removeEventListener('ended', handleEnded);
      videoPlayerB.current?.removeEventListener('ended', handleEnded);
      videoPlayerA.current?.removeEventListener('play', handlePlay);
      videoPlayerB.current?.removeEventListener('play', handlePlay);
      videoPlayerA.current?.removeEventListener('pause', handlePause);
      videoPlayerB.current?.removeEventListener('pause', handlePause);
    };
  }, [playlist.length]);

  useEffect(() => {
    if (videoPlayerA.current === null || videoPlayerB.current === null || playlist.length === 0) {
      return;
    }

    if (currentClipIndex === 0) {
      videoPlayerA.current!.src = playlist[currentClipIndex].src;
      videoPlayerA.current!.load();
    }

    if (!isOdd(currentClipIndex)) {
      setActivePlayer('A');
      videoPlayerA.current!.play().catch(e => console.error('Error playing video A:', e));
      if (videoPlayerB.current && !videoPlayerB.current.paused && !videoPlayerB.current.ended) {
        videoPlayerB.current.pause();
      }

      if (currentClipIndex + 1 < playlist.length) {
        setTimeout(() => {
          videoPlayerB.current!.src = playlist[currentClipIndex + 1].src;
          videoPlayerB.current!.load();
        }, 100);
      }
    } else {
      setActivePlayer('B');
      videoPlayerB.current!.play().catch(e => console.error('Error playing video B:', e));
      if (videoPlayerA.current && !videoPlayerA.current.paused && !videoPlayerA.current.ended) {
        videoPlayerA.current.pause();
      }

      if (currentClipIndex + 1 < playlist.length) {
        setTimeout(() => {
          videoPlayerA.current!.src = playlist[currentClipIndex + 1].src;
          videoPlayerA.current!.load();
        }, 100);
      }
    }
  }, [currentClipIndex]);

  function togglePlay() {
    const currentPlayer = activePlayer === 'A' ? videoPlayerA.current : videoPlayerB.current;
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
    if (!isOdd(index)) {
      //Will use player A
      videoPlayerA.current!.src = playlist[index].src;
      videoPlayerA.current!.load();
    } else {
      //Will use player B
      videoPlayerB.current!.src = playlist[index].src;
      videoPlayerB.current!.load();
    }
    setCurrentClipIndex(index);
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
          ref={videoPlayerA}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: activePlayer === 'A' ? 'block' : 'none',
          }}
        />
        <video
          onClick={togglePlay}
          ref={videoPlayerB}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: activePlayer === 'B' ? 'block' : 'none',
          }}
        />
      </div>
      <div style={{ display: 'flex', marginTop: '16px' }}>
        <div style={{ cursor: 'pointer' }} onClick={() => togglePlay()}>
          {playPauseButton()}
        </div>
        <Scrollable
          horizontal={true}
          style={{
            width: '100%',
            paddingLeft: '8px',
            paddingRight: '8px',
            height: '48px',
            display: 'flex',
          }}
        >
          <div
            style={{
              width: 'max-content',
              minWidth: '100%',
              display: 'flex',
              gap: '4px',
              paddingBottom: '6px',
              justifyContent: 'center',
            }}
          >
            {sortedClips.map(({ path }, index) => {
              return (
                <div
                  key={'preview-mini' + path}
                  style={{
                    cursor: 'pointer',
                    borderRadius: '6px',
                    width: 'fit-content',
                    border: `solid 2px ${
                      sortedClips[currentClipIndex].path === path ? 'white' : 'transparent'
                    }`,
                  }}
                  onClick={() => {
                    jumpToClip(index);
                  }}
                >
                  <MiniClipPreview
                    clipId={path}
                    // highlighted={hoveredId === id && !onMove}
                    highlighted={false}
                  ></MiniClipPreview>
                </div>
              );
            })}
          </div>
        </Scrollable>{' '}
      </div>
    </div>
  );
}
