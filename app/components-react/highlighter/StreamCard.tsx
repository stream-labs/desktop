import React from 'react';
import {
  EAiDetectionState,
  EHighlighterView,
  IHighlightedStream,
  IViewState,
  StreamInfoForAiHighlighter,
  TClip,
} from 'services/highlighter';
import styles from './StreamCard.m.less';
import { Button } from 'antd';
import { Services } from 'components-react/service-provider';
import { isAiClip } from './utils';
import { useVuex } from 'components-react/hooks';
import { InputEmojiSection } from './InputEmojiSection';
import { $t } from 'services/i18n';

export default function StreamCard({
  streamId,
  clipsOfStreamAreLoading,
  emitSetView,
  emitGeneratePreview,
  emitExportVideo,
  emitRemoveStream,
  emitCancelHighlightGeneration,
}: {
  streamId: string;
  clipsOfStreamAreLoading: string | null;
  emitSetView: (data: IViewState) => void;
  emitGeneratePreview: () => void;
  emitExportVideo: () => void;
  emitRemoveStream: () => void;
  emitCancelHighlightGeneration: () => void;
}) {
  const { HighlighterService } = Services;
  const clips = useVuex(() =>
    HighlighterService.views.clips
      .filter(c => c.streamInfo?.[streamId])
      .map(clip => {
        if (isAiClip(clip) && (clip.aiInfo as any).moments) {
          clip.aiInfo.inputs = (clip.aiInfo as any).moments;
        }
        return clip;
      }),
  );
  const stream = useVuex(() =>
    HighlighterService.views.highlightedStreams.find(s => s.id === streamId),
  );
  if (!stream) {
    return <></>;
  }

  function showStreamClips() {
    if (stream?.state.type !== EAiDetectionState.IN_PROGRESS) {
      emitSetView({ view: EHighlighterView.CLIPS, id: stream?.id });
    }
  }

  return (
    <div
      className={styles.streamCard}
      onClick={() => {
        showStreamClips();
      }}
    >
      <Thumbnail
        clips={clips}
        clipsOfStreamAreLoading={clipsOfStreamAreLoading}
        stream={stream}
        emitGeneratePreview={emitGeneratePreview}
        emitCancelHighlightGeneration={emitCancelHighlightGeneration}
        emitRemoveStream={emitRemoveStream}
      />
      <div className={styles.streaminfoWrapper}>
        <div className={styles.titleRotatedClipsWrapper}>
          <div className={styles.titleDateWrapper}>
            <h2 className={styles.streamcardTitle}>{stream.title}</h2>
            <p style={{ margin: 0, fontSize: '12px' }}>{new Date(stream.date).toDateString()}</p>
          </div>
          <RotatedClips clips={clips} />
        </div>
        <h3 className={styles.emojiWrapper}>
          {stream.state.type === EAiDetectionState.FINISHED ? (
            <InputEmojiSection
              clips={clips}
              includeRounds={true}
              includeDeploy={false}
              showCount={true}
              showDescription={true}
              showDeathPlacement={false}
            />
          ) : (
            <div style={{ height: '22px' }}> </div>
          )}
        </h3>
        <ActionBar
          stream={stream}
          clips={clips}
          emitCancelHighlightGeneration={emitCancelHighlightGeneration}
          emitExportVideo={emitExportVideo}
          emitShowStreamClips={showStreamClips}
          clipsOfStreamAreLoading={clipsOfStreamAreLoading}
          emitRestartAiDetection={() => {
            HighlighterService.actions.restartAiDetection(stream.path, stream);
          }}
          emitSetView={emitSetView}
        />
      </div>
    </div>
  );
}

function ActionBar({
  stream,
  clips,
  clipsOfStreamAreLoading,
  emitCancelHighlightGeneration,
  emitExportVideo,
  emitShowStreamClips,
  emitRestartAiDetection,
  emitSetView,
}: {
  stream: IHighlightedStream;
  clips: TClip[];
  clipsOfStreamAreLoading: string | null;
  emitCancelHighlightGeneration: () => void;
  emitExportVideo: () => void;
  emitShowStreamClips: () => void;
  emitRestartAiDetection: () => void;
  emitSetView: (data: IViewState) => void;
}): JSX.Element {
  function getFailedText(state: EAiDetectionState): string {
    switch (state) {
      case EAiDetectionState.ERROR:
        return $t('Highlights failed');
      case EAiDetectionState.CANCELED_BY_USER:
        return $t('Highlights cancelled');
      default:
        return '';
    }
  }

  // In Progress
  if (stream?.state.type === EAiDetectionState.IN_PROGRESS) {
    return (
      <div className={styles.progressbarBackground}>
        <div className={styles.progressbarText}>{$t('Searching for highlights...')}</div>
        <div
          className={styles.progressbarProgress}
          style={{
            opacity: stream.state.progress < 1 ? 0 : 1,
            transform: `scaleX(${stream.state.progress / 100})`,
            transformOrigin: 'left',
            transition: 'transform 1000ms',
          }}
        ></div>

        <Button
          size="large"
          className={styles.cancelButton}
          onClick={e => {
            e.stopPropagation();
            emitCancelHighlightGeneration();
          }}
        >
          <i className="icon-close" />
        </Button>
      </div>
    );
  }

  // If finished
  if (stream && clips.length > 0) {
    return (
      <div className={styles.buttonBarWrapper}>
        <Button
          icon={<i className="icon-edit" style={{ marginRight: '4px' }} />}
          size="large"
          onClick={emitShowStreamClips}
        >
          {$t('Edit Clips')}
        </Button>

        {/* TODO: What clips should be included when user clicks this button + bring normal export modal in here */}
        <Button
          size="large"
          type="primary"
          onClick={e => {
            emitExportVideo();
            e.stopPropagation();
          }}
          style={{ display: 'grid', gridTemplateAreas: 'stack' }}
        >
          <div
            style={{
              visibility: clipsOfStreamAreLoading === stream.id ? 'visible' : 'hidden',
              gridArea: 'stack',
            }}
          >
            <i className="fa fa-spinner fa-pulse" />
          </div>
          <span
            style={{
              visibility: clipsOfStreamAreLoading !== stream.id ? 'visible' : 'hidden',
              gridArea: 'stack',
            }}
          >
            <i className="icon-download" style={{ marginRight: '4px' }} />
            {$t('Export highlight reel')}
          </span>
        </Button>
      </div>
    );
  }

  //if failed or no clips
  return (
    <div className={styles.buttonBarWrapper}>
      <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
        {getFailedText(stream.state.type)}
      </div>
      <div style={{ display: 'flex', gap: '4px' }}>
        {stream?.state.type === EAiDetectionState.CANCELED_BY_USER ? (
          <Button
            size="large"
            onClick={e => {
              emitRestartAiDetection();
              e.stopPropagation();
            }}
          >
            {$t('Restart')}
          </Button>
        ) : (
          <Button
            size="large"
            onClick={e => {
              emitSetView({ view: EHighlighterView.CLIPS, id: stream!.id });
              e.stopPropagation();
            }}
          >
            {$t('Add Clips')}
          </Button>
        )}
      </div>
    </div>
  );
}

export function Thumbnail({
  clips,
  clipsOfStreamAreLoading,
  stream,
  emitGeneratePreview,
  emitCancelHighlightGeneration,
  emitRemoveStream,
}: {
  clips: TClip[];
  clipsOfStreamAreLoading: string | null;
  stream: IHighlightedStream;
  emitGeneratePreview: () => void;
  emitCancelHighlightGeneration: () => void;
  emitRemoveStream: () => void;
}) {
  function getThumbnailText(state: EAiDetectionState): JSX.Element | string {
    if (clipsOfStreamAreLoading === stream?.id) {
      return <i className="fa fa-spinner fa-pulse" style={{ marginLeft: 8 }} />;
    }

    if (clips.length > 0) {
      return <PlayButton />;
    }
    switch (state) {
      case EAiDetectionState.IN_PROGRESS:
        return $t('Searching for highlights...');
      case EAiDetectionState.FINISHED:
        if (clips.length === 0) {
          return $t('Not enough highlights found');
        }
        return <PlayButton />;
      case EAiDetectionState.CANCELED_BY_USER:
        return $t('Highlights cancelled');
      case EAiDetectionState.ERROR:
        return $t('Highlights cancelled');
      default:
        return '';
    }
  }

  return (
    <div className={`${styles.thumbnailWrapper} `}>
      <Button
        size="large"
        className={styles.deleteButton}
        onClick={e => {
          if (stream.state.type === EAiDetectionState.IN_PROGRESS) {
            emitCancelHighlightGeneration();
          }
          emitRemoveStream();
          e.stopPropagation();
        }}
        style={{ backgroundColor: '#00000040', border: 'none', position: 'absolute' }}
      >
        <i className="icon-trash" />
      </Button>
      <img
        onClick={e => {
          if (stream.state.type !== EAiDetectionState.IN_PROGRESS) {
            emitGeneratePreview();
            e.stopPropagation();
          }
        }}
        style={{ height: '100%' }}
        src={
          clips.find(clip => clip?.streamInfo?.[stream.id]?.orderPosition === 0)?.scrubSprite ||
          clips.find(clip => clip.scrubSprite)?.scrubSprite
        }
        alt=""
      />
      <div className={styles.centeredOverlayItem}>
        <div
          onClick={e => {
            if (stream.state.type !== EAiDetectionState.IN_PROGRESS) {
              emitGeneratePreview();
              e.stopPropagation();
            }
          }}
        >
          {getThumbnailText(stream.state.type)}
        </div>
      </div>
    </div>
  );
}

export function RotatedClips({ clips }: { clips: TClip[] }) {
  return (
    <div style={{ width: '74px', position: 'relative' }}>
      {clips.length > 0 ? (
        <div style={{ transform: 'translateX(-10px)' }}>
          <div className={styles.clipsAmount}>
            <span>{clips.length}</span>
            <span>clips</span>
          </div>
          {clips.slice(0, 3).map((clip, index) => (
            <div
              className={styles.thumbnailWrapperSmall}
              style={{
                rotate: `${(index - 1) * 6}deg`,
                scale: '1.2',
                transform: `translate(${(index - 1) * 9}px, ${index === 1 ? 0 + 4 : 2 + 4}px)`,
                zIndex: index === 1 ? 10 : 0,
              }}
              key={index}
            >
              <img style={{ height: '100%' }} src={clip.scrubSprite || ''} />
            </div>
          ))}
        </div>
      ) : (
        ''
      )}
    </div>
  );
}

export const PlayButton = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M31.3111 17.05L12.9395 4.36284C11.6534 3.45661 10 4.36284 10 5.8128V31.1872C10 32.6372 11.6534 33.5434 12.9395 32.6372L31.3111 19.95C32.2296 19.225 32.2296 17.775 31.3111 17.05"
      fill="white"
    />
  </svg>
);
export const PauseButton = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="7" y="5" width="10" height="28" rx="2" fill="white" />
    <rect x="21" y="5" width="10" height="28" rx="2" fill="white" />
  </svg>
);
