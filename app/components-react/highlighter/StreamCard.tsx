import React from 'react';
import { HighlighterService, IHighlightedStream, IViewState, TClip } from 'services/highlighter';
import styles from './StreamView.m.less';
import { Button } from 'antd';
import { Services } from 'components-react/service-provider';
import { isAiClip } from './utils';
import { useVuex } from 'components-react/hooks';

export default function StreamCard({
  streamId,
  clipsOfStreamAreLoading,
  emitSetView,
  emitGeneratePreview,
  emitExportVideo,
  emitRemoveStream,
}: {
  streamId: string;
  clipsOfStreamAreLoading: string | null;
  emitSetView: (data: IViewState) => void;
  emitGeneratePreview: () => void;
  emitExportVideo: () => void;
  emitRemoveStream: () => void;
}) {
  const { HighlighterService } = Services;
  const clips = useVuex(() =>
    HighlighterService.views.clips.filter(c => c.streamInfo?.id === streamId),
  );
  const stream = useVuex(() =>
    HighlighterService.views.highlightedStreams.find(s => s.id === streamId),
  );
  if (!stream) {
    return <>error</>;
  }
  function getMomentTypeCount(clips: TClip[]): { [type: string]: number } {
    const typeCounts: { [type: string]: number } = {};

    clips.forEach(clip => {
      if (isAiClip(clip)) {
        clip.aiInfo.moments.forEach(moment => {
          const type = moment.type;
          if (typeCounts[type]) {
            typeCounts[type] += 1;
          } else {
            typeCounts[type] = 1;
          }
        });
      }
    });

    return typeCounts;
  }

  function getWordingFromType(type: string): { emoji: string; description: string } {
    switch (type) {
      case 'kill':
        return { emoji: '💀', description: 'kills' };
      case 'death':
        return { emoji: '🪦', description: 'deaths' };
      case 'victory':
        return { emoji: '🏆', description: 'victory' };
      case 'deploy':
        return { emoji: '🪂', description: 'games started' };

      default:
        break;
    }
    return { emoji: type, description: type };
  }

  return (
    <div className={styles.streamCard}>
      <div
        className={`${styles.thumbnailWrapper} ${styles.videoSkeleton}`}
        onClick={() => {
          if (stream.state.type === 'detection-finished') {
            emitGeneratePreview();
          }
        }}
      >
        <img
          style={{ height: '100%' }}
          src={
            clips.find(clip => clip.streamInfo?.orderPosition === 0)?.scrubSprite ||
            clips.find(clip => clip.scrubSprite)?.scrubSprite
          }
          alt=""
        />
        <div className={styles.centeredOverlayItem}>
          {' '}
          <div>
            {stream.state.type === 'detection-finished' ? (
              '▶️'
            ) : (
              <>
                {stream.state.type === 'detection-canceled-by-user' || stream.state.type === 'error'
                  ? 'Ai detection failed'
                  : 'Searching for highlights...'}
              </>
            )}
            {clipsOfStreamAreLoading === stream.id ? (
              <>
                <div className={styles.loader}></div>
              </>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '20px',
          paddingTop: '0px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '8px',
            height: 'fit-content',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              height: 'fit-content',
            }}
          >
            <h2 style={{ margin: 0 }}>{stream.title}</h2>
            <p style={{ margin: 0, fontSize: '12px' }}>{new Date(stream.date).toDateString()}</p>
          </div>
          <div style={{ width: '74px', position: 'relative' }}>
            {stream.state.type === 'detection-finished' ? (
              <>
                <div
                  className={styles.centeredOverlayItem}
                  style={{ display: 'flex', gap: '3px', paddingRight: '3px' }}
                >
                  <span>{clips.length}</span>
                  <span>clips</span>
                </div>
                {clips
                  .slice(0, 3) // Take only the first three clips that match
                  .map((clip, index) => (
                    <div
                      className={styles.thumbnailWrapperSmall}
                      style={{
                        rotate: `${(index - 1) * 6}deg`,
                        transform: `translate(${(index - 1) * 6}px, ${index === 1 ? 0 : 2}px)`,
                        zIndex: index === 1 ? 10 : 0,
                      }}
                      key={index}
                    >
                      <img
                        style={{ height: '100%' }}
                        src={clip.scrubSprite}
                        alt={`Clip ${index + 1}`}
                      />
                    </div>
                  ))}{' '}
              </>
            ) : (
              ''
            )}
          </div>
        </div>
        <div style={{ paddingTop: '6px', paddingBottom: '6px' }}>
          <h3
            style={{
              margin: 0,
              display: 'flex',
              gap: '16px',
              justifyContent: 'start',
            }}
          >
            {stream.state.type === 'detection-finished' ? (
              <>
                {clips.some(c => c.streamInfo?.id === stream.id)
                  ? Object.entries(getMomentTypeCount(clips)).map(([type, count]) => (
                      <div key={type} style={{ display: 'flex', gap: '4px' }}>
                        <span key={type + 'emoji'}>{getWordingFromType(type).emoji} </span>{' '}
                        <span key={type + 'desc'}>
                          {' '}
                          {count} {getWordingFromType(type).description}
                        </span>
                      </div>
                    ))
                  : 'No Highlights found'}
              </>
            ) : (
              <>
                <div style={{ height: '22px' }}></div>
              </>
            )}
          </h3>
        </div>

        {/* ProgressBar or actionRow */}
        {stream.state.type !== 'detection-finished' ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              height: '40px',
              backgroundColor: 'gray',
              borderRadius: '4px',
            }}
          >
            <div
              style={{
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '16px',
                position: 'absolute',
                color: 'black',
                fontSize: '16px',
              }}
            >
              {stream.state.type === 'detection-canceled-by-user' || stream.state.type === 'error'
                ? 'Ai detection failed'
                : 'Creating Ai highlights...'}
            </div>
            <div
              style={{
                height: '100%',
                backgroundColor: '#F5F8FA',
                width: `${stream.state.progress}%`,
                borderRadius: '4px',
                transition: 'width 1s',
              }}
            ></div>{' '}
            {stream.state.type === 'detection-canceled-by-user' || stream.state.type === 'error' ? (
              <Button
                size="large"
                style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                onClick={() => emitRemoveStream()}
              >
                <i className="icon-trash" />
              </Button>
            ) : (
              ''
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              gap: '4px',
              justifyContent: 'space-between',
            }}
          >
            <Button
              size="large"
              style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
              disabled={stream.state.type !== 'detection-finished'}
              onClick={() => {
                emitSetView({ view: 'clips', id: stream.id });
              }}
            >
              <i className="icon-edit" /> Edit clips
            </Button>
            <Button
              size="large"
              style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
              onClick={() => emitRemoveStream()}
            >
              <i className="icon-trash" />
            </Button>
            {/* TODO: What clips should be included when user clicks this button + bring normal export modal in here */}
            <Button
              size="large"
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
              }}
              disabled={setExportButton().disabled}
              type="primary"
              onClick={() => emitExportVideo()}
            >
              {clipsOfStreamAreLoading === stream.id ? (
                //  TODO: replace with correct loader
                <div className={styles.loader}></div>
              ) : (
                <>
                  <i className="icon-download" /> {setExportButton().text}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  function setExportButton(): { disabled: boolean; text: string } {
    const disabled =
      stream!.state.type !== 'detection-finished' ||
      (stream!.state.type !== 'detection-finished' && clips.length === 0) ||
      !clips.some(c => c.streamInfo?.id === stream!.id);

    const text =
      stream!.state.type === 'detection-finished' && clips.length === 0
        ? 'No highlights found'
        : 'Export highlight reel';

    return { disabled, text };
  }
}
