import { useVuex } from 'components-react/hooks';
import React, { useEffect, useRef, useState } from 'react';
import { Services } from 'components-react/service-provider';
import { $t } from 'services/i18n';
import { TClip } from 'services/highlighter';
import { sortClips } from './utils';

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
  const playlist = sortClips(clips, streamId)
    .filter(c => c.enabled)
    .map((clip: TClip) => ({
      src: clip.path + `#t=${clip.startTrim},${clip.duration! - clip.endTrim}`,
      start: clip.startTrim,
      end: clip.duration! - clip.endTrim,
      type: 'video/mp4',
    }));
  const videoPlayerA = useRef<HTMLVideoElement>(null);
  const videoPlayerB = useRef<HTMLVideoElement>(null);
  const [activePlayer, setActivePlayer] = useState<'A' | 'B'>('A');
  const isChangingClip = useRef(false);

  function isOdd(num: number): boolean {
    return num % 2 === 1;
  }
  function isRoughlyEqual(a: number, b: number, tolerance: number = 0.2): boolean {
    return Math.abs(a - b) <= tolerance;
  }
  useEffect(() => {
    console.log('playlist', playlist);
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
      console.log('ended from ended');
      nextClip();
    };

    const handlePause = () => {
      const currentPlayer = activePlayer === 'A' ? videoPlayerA.current : videoPlayerB.current;
      // console.log('currentPlayer?.currentTime', currentPlayer?.currentTime);
      // console.log('playlist[currentClipIndex].end', playlist[currentClipIndex].end);
      // console.log(
      //   'true!',
      //   isRoughlyEqual(currentPlayer!.currentTime, playlist[currentClipIndex].end),
      // );
      // console.log('isBigger', currentPlayer!.currentTime > playlist[currentClipIndex].end);
      if (!currentPlayer) {
        return;
      }
      if (
        currentPlayer.currentTime > playlist[currentClipIndex].end ||
        isRoughlyEqual(currentPlayer.currentTime, playlist[currentClipIndex].end)
      ) {
        console.log('ended from pause');
        nextClip();
      }
    };

    videoPlayerA.current?.addEventListener('ended', handleEnded);
    videoPlayerB.current?.addEventListener('ended', handleEnded);
    videoPlayerA.current?.addEventListener('pause', handlePause);
    videoPlayerB.current?.addEventListener('pause', handlePause);

    return () => {
      videoPlayerA.current?.removeEventListener('ended', handleEnded);
      videoPlayerB.current?.removeEventListener('ended', handleEnded);
      videoPlayerA.current?.addEventListener('pause', handlePause);
      videoPlayerB.current?.addEventListener('pause', handlePause);
    };
  }, [playlist.length]);

  useEffect(() => {
    if (videoPlayerA.current === null || videoPlayerB.current === null) {
      return;
    }
    console.log(
      'currentClipIndex',
      currentClipIndex,
      !isOdd(currentClipIndex) ? 'should A' : ' should  B',
    );
    if (currentClipIndex === 0) {
      videoPlayerA.current!.src = playlist[currentClipIndex].src;
      videoPlayerA.current!.load();
    }

    if (!isOdd(currentClipIndex)) {
      console.log('set A');
      setActivePlayer('A');
      if (currentClipIndex + 1 < playlist.length) {
        setTimeout(() => {
          videoPlayerB.current!.src = playlist[currentClipIndex + 1].src;
          videoPlayerB.current!.load();
        }, 100);
      }
    } else {
      console.log('set B');

      setActivePlayer('B');
      if (currentClipIndex + 1 < playlist.length) {
        setTimeout(() => {
          videoPlayerA.current!.src = playlist[currentClipIndex + 1].src;
          videoPlayerA.current!.load();
        }, 100);
      }
    }
  }, [currentClipIndex]);

  useEffect(() => {
    console.log('activePlayer changed', activePlayer);

    if (activePlayer === 'A') {
      console.log('play  - event A');

      videoPlayerA.current!.play().catch(e => console.error('Error playing video A:', e));
      if (videoPlayerB.current && !videoPlayerB.current.paused && !videoPlayerB.current.ended) {
        console.log('pause B');
        videoPlayerB.current.pause();
      }
    } else {
      console.log('play b');

      videoPlayerB.current!.play().catch(e => console.error('Error playing video B:', e));
      if (videoPlayerA.current && !videoPlayerA.current.paused && !videoPlayerA.current.ended) {
        console.log('pause A');
        videoPlayerA.current.pause();
      }
    }
  }, [activePlayer]);

  function togglePlay() {
    const currentPlayer = activePlayer === 'A' ? videoPlayerA.current : videoPlayerB.current;
    if (currentPlayer?.paused) {
      currentPlayer.play().catch(e => console.error('Error playing video:', e));
    } else {
      console.log('pause');

      currentPlayer?.pause();
    }
  }

  return (
    <div>
      <h2>{$t('Render Preview')}</h2>
      <p>
        {$t(
          'The render preview shows a low-quality preview of the final rendered video. The final exported video will be higher resolution, framerate, and quality.',
        )}
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
    </div>
  );
}
