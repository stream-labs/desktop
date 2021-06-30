import React, { useEffect, useRef, useState, RefObject } from 'react';
import { IClip } from 'services/highlighter';
import { SCRUB_FRAMES, SCRUB_HEIGHT, SCRUB_WIDTH } from 'services/highlighter/constants';
import { Services } from 'components-react/service-provider';
import times from 'lodash/times';
import styles from './ClipTrimmer.m.less';
import cx from 'classnames';

type TDragType = 'start' | 'end';

/**
 * When you need a mix of state and ref semantics, this can help
 * keep them both in sync
 * @param initialValue The initial value
 */
function useStateRef<T>(initialValue: T): [RefObject<T>, (newValue: T) => void] {
  const [state, setState] = useState(initialValue);
  const ref = useRef(initialValue);

  return [
    ref,
    val => {
      setState(val);
      ref.current = val;
    },
  ];
}

export default function ClipTrimmer(props: { clip: IClip }) {
  const { HighlighterService } = Services;
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(props.clip.startTrim);
  const [scrubFrames, setScrubFrames] = useState<number[]>([]);
  const [localStartTrim, setLocalStartTrim] = useState(props.clip.startTrim);
  const [localEndTrim, setLocalEndTrim] = useState(props.clip.endTrim);
  const playPastEnd = useRef(false);
  const isDragging = useRef<TDragType | null>(null);
  const isScrubbing = useRef(false);
  const [isPlaying, setIsPlaying] = useStateRef(false);

  const endTime = props.clip.duration! - localEndTrim;

  function playAt(t: number) {
    if (!videoRef.current) return;

    setIsPlaying(true);
    videoRef.current.currentTime = t;
    videoRef.current.play();

    playPastEnd.current = t > endTime;

    updatePlayhead();
  }

  function updatePlayhead() {
    if (!videoRef.current) return;

    setCurrentTime(videoRef.current.currentTime);

    if (!playPastEnd.current && videoRef.current.currentTime >= endTime) stopPlaying();

    if (isPlaying.current) {
      requestAnimationFrame(updatePlayhead);
    }
  }

  function stopPlaying() {
    if (!videoRef.current) return;

    setIsPlaying(false);
    videoRef.current.pause();
  }

  function togglePlayPause() {
    if (isPlaying.current) {
      stopPlaying();
    } else {
      playAt(localStartTrim);
    }
  }

  useEffect(() => {
    playAt(localStartTrim);

    return stopPlaying;
  }, []);

  function startDragging(e: React.MouseEvent, type: TDragType) {
    e.stopPropagation();
    isDragging.current = type;
  }

  function onMouseDown() {
    stopPlaying();
    isScrubbing.current = true;
  }

  function onMouseUp(e: React.MouseEvent) {
    if (isDragging.current) {
      stopDragging();
    } else {
      isScrubbing.current = false;
      const timelineWidth = timelineRef.current!.offsetWidth;
      const timelineOffset = timelineRef.current!.getBoundingClientRect().left;
      playAt(((e.clientX - timelineOffset) / timelineWidth) * props.clip.duration!);
    }
  }

  function onMouseMove(e: React.MouseEvent) {
    const timelineWidth = timelineRef.current!.offsetWidth;

    if (isDragging.current) {
      if (isDragging.current === 'start') {
        const timelineOffset = timelineRef.current!.getBoundingClientRect().left;
        const time = ((e.clientX - timelineOffset) / timelineWidth) * props.clip.duration!;
        setLocalStartTrim(Math.min(time, endTime));
      } else {
        const timelineOffset = timelineRef.current!.getBoundingClientRect().right;
        const time = ((timelineOffset - e.clientX) / timelineWidth) * props.clip.duration!;
        setLocalEndTrim(Math.min(time, props.clip.duration! - localStartTrim));
      }
    } else if (isScrubbing.current) {
      if (!videoRef.current) return;
      const timelineOffset = timelineRef.current!.getBoundingClientRect().left;
      const time = ((e.clientX - timelineOffset) / timelineWidth) * props.clip.duration!;

      videoRef.current.currentTime = time;
      updatePlayhead();
    }
  }

  function onMouseLeave() {
    isDragging.current = null;
    isScrubbing.current = false;
  }

  function stopDragging() {
    if (isDragging.current === 'start') {
      HighlighterService.actions.setStartTrim(props.clip.path, localStartTrim);
    } else if (isDragging.current === 'end') {
      HighlighterService.actions.setEndTrim(props.clip.path, localEndTrim);
    }

    isDragging.current = null;
    playAt(localStartTrim);
    // TODO - dispatch action to highlighter service
  }

  const scrubHeight = 80;
  const scrubWidth = scrubHeight * (SCRUB_WIDTH / SCRUB_HEIGHT);

  // TODO: React to window size change
  useEffect(() => {
    const timelineWidth = timelineRef.current!.offsetWidth;
    // Always subtract 1 frame so it isn't too squished in
    const nFrames = Math.floor(timelineWidth / scrubWidth) - 1;
    setScrubFrames(
      times(nFrames).map(n => {
        return Math.floor((n / (nFrames - 1)) * (SCRUB_FRAMES - 1));
      }),
    );
  }, []);

  return (
    <div>
      <video
        ref={videoRef}
        src={props.clip.path}
        width="100%"
        onEnded={() => {
          setIsPlaying(false);
        }}
        onClick={togglePlayPause}
      />
      <div
        ref={timelineRef}
        style={{
          width: '100%',
          height: 100,
          position: 'relative',
          background: 'var(--section)',
          marginTop: 10,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          borderRadius: 5,
        }}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        {scrubFrames.map(frame => {
          return (
            <img
              key={frame}
              src={props.clip.scrubSprite}
              width={SCRUB_WIDTH}
              height={SCRUB_HEIGHT}
              style={{
                height: scrubHeight,
                width: scrubWidth,
                objectFit: 'cover',
                objectPosition: `-${frame * SCRUB_WIDTH * (scrubHeight / SCRUB_HEIGHT)}px`,
                borderRadius: 5,
                pointerEvents: 'none',
              }}
            ></img>
          );
        })}
        <div
          style={{
            left: `${(currentTime / props.clip.duration!) * 100}%`,
          }}
          className={cx(styles.clipPlayhead, { [styles.clipPlayheadPlaying]: isPlaying.current })}
        ></div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: `${(localStartTrim / props.clip.duration!) * 100}%`,
            height: 100,
            backgroundColor: 'black',
            opacity: 0.9,
            borderRadius: 5,
          }}
        >
          <div
            className={styles.clipResizeHandle}
            onMouseDown={e => startDragging(e, 'start')}
          ></div>
        </div>
        <div
          style={{
            position: 'absolute',
            right: 0,
            width: `${(localEndTrim / props.clip.duration!) * 100}%`,
            height: 100,
            backgroundColor: 'black',
            opacity: 0.9,
            borderRadius: 5,
          }}
        >
          <div
            className={cx(styles.clipResizeHandle, styles.clipResizeHandleRight)}
            onMouseDown={e => startDragging(e, 'end')}
          ></div>
        </div>
      </div>
    </div>
  );
}
