import React, { useEffect, useRef, useState } from 'react';
import { IClip, SCRUB_FRAMES, SCRUB_HEIGHT, SCRUB_WIDTH } from 'services/highlighter';
import times from 'lodash/times';

export default function ClipTrimmer(props: { clip: IClip }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const startTime = props.clip.startTrim;
  const endTime = props.clip.duration! - props.clip.endTrim;
  const [currentTime, setCurrentTime] = useState(startTime);
  const [scrubFrames, setScrubFrames] = useState<number[]>([]);
  const isPlaying = useRef(false);
  const playPastEnd = useRef(false);

  function playAt(t: number) {
    if (!videoRef.current) return;

    isPlaying.current = true;
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

    isPlaying.current = false;
    videoRef.current.pause();
  }

  function togglePlayPause() {
    if (isPlaying.current) {
      stopPlaying();
    } else {
      playAt(startTime);
    }
  }

  useEffect(() => {
    playAt(startTime);

    return stopPlaying;
  }, []);

  function onTimelineClick(e: React.MouseEvent) {
    const timelineWidth = timelineRef.current!.offsetWidth;
    const timelineOffset = timelineRef.current!.getBoundingClientRect().left;
    playAt(((e.clientX - timelineOffset) / timelineWidth) * props.clip.duration!);
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
        onEnded={() => (isPlaying.current = false)}
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
        onClick={onTimelineClick}
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
              }}
            ></img>
          );
        })}
        <div
          style={{
            position: 'absolute',
            left: `${(currentTime / props.clip.duration!) * 100}%`,
            width: 5,
            height: 100,
            backgroundColor: 'white',
            zIndex: 100,
          }}
        ></div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: `${(props.clip.startTrim / props.clip.duration!) * 100}%`,
            height: 100,
            backgroundColor: 'black',
            opacity: 0.9,
            borderRadius: 5,
          }}
        ></div>
        <div
          style={{
            position: 'absolute',
            right: 0,
            width: `${(props.clip.endTrim / props.clip.duration!) * 100}%`,
            height: 100,
            backgroundColor: 'black',
            opacity: 0.9,
            borderRadius: 5,
          }}
        ></div>
      </div>
    </div>
  );
}
