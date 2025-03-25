import { Form, Dropdown, Button, Collapse, CollapseProps } from 'antd';
import { useVuex } from 'components-react/hooks';
import { useController } from 'components-react/hooks/zustand';
import { ListInput } from 'components-react/shared/inputs';
import React, { useEffect, useState } from 'react';
import { TOrientation, EOrientation } from 'services/highlighter/models/ai-highlighter.models';
import { $t } from 'services/i18n';
import { ExportModalCtx } from './ExportModal';
import StorageUpload from './StorageUpload';
import YoutubeUpload from './YoutubeUpload';
import { Services } from 'components-react/service-provider';
import styles from './ExportModal.m.less';
import VideoPreview from './VideoPreview';
import { formatSecondsToHMS } from '../ClipPreview';
import { $i } from 'services/utils';
import * as remote from '@electron/remote';
import { EUploadPlatform } from 'services/highlighter/models/highlighter.models';

export default function PlatformSelect({
  onClose,
  videoName,
  streamId,
}: {
  onClose: () => void;
  videoName: string;
  streamId: string | undefined;
}) {
  const { store, exportInfo, clearUpload, getStreamTitle, getClips, getDuration } = useController(
    ExportModalCtx,
  );
  const { UserService, HighlighterService } = Services;
  const { isYoutubeLinked } = useVuex(() => ({
    isYoutubeLinked: !!UserService.state.auth?.platforms.youtube,
  }));
  const [platform, setPlatform] = useState(() => (isYoutubeLinked ? 'youtube' : 'crossclip'));
  const clipsAmount = getClips(streamId).length;
  const clipsDuration = formatSecondsToHMS(getDuration(streamId));
  async function handlePlatformSelect(val: string) {
    if (platform === 'youtube') await clearUpload();
    setPlatform(val);
  }

  useEffect(() => {
    HighlighterService.clearUpload();
  }, []);

  const platformOptions = [
    { label: 'YouTube', value: 'youtube' },
    { label: 'Cross Clip', value: 'crossclip' },
    { label: 'Podcast Editor', value: 'typestudio' },
    { label: 'Video Editor', value: 'videoeditor' },
  ];

  const items = [
    {
      key: '1',
      label: 'Youtube',
      children: <YoutubeUpload defaultTitle={videoName} close={onClose} streamId={streamId} />,
    },
  ];

  return (
    <div className={styles.modalWrapper}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ fontWeight: 600, margin: 0 }}>{$t('Publish to')}</h2>{' '}
        <div>
          <Button type="text" onClick={onClose}>
            <i className="icon-close" style={{ margin: 0 }}></i>
          </Button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '16px' }}>
        <h2 className={styles.customInput} style={{ width: 'fit-content', whiteSpace: 'nowrap' }}>
          {videoName}
        </h2>
        <p style={{ width: 'fit-content', whiteSpace: 'nowrap' }}>
          {clipsAmount} | {clipsDuration}
        </p>
      </div>
      <div className={styles.publishWrapper}>
        <div className={styles.videoWrapper}>
          <VideoPreview />
        </div>
        <div
          style={{
            width: '100%',
            height: '100%',
            overflowY: 'scroll',
            paddingRight: '8px',
          }}
        >
          <Collapse
            expandIconPosition="right"
            defaultActiveKey={['1']}
            bordered={false}
            style={{ width: '424px', height: '424px' }}
          >
            {items.map((item: any) => (
              <Collapse.Panel
                key={item.key}
                header={item.label}
                style={{
                  marginBottom: '12px',
                  borderStyle: 'solid',
                  borderWidth: '1px',
                  borderColor: '#ffffff10',
                  borderRadius: '8px',
                  backgroundColor: '#232d3530',
                }}
              >
                {item.children}
              </Collapse.Panel>
            ))}
          </Collapse>
        </div>
      </div>
      <div className={styles.bottomRow}>
        <Button
          style={{ height: '100%', borderRadius: '8px' }}
          onClick={() => {
            remote.shell.showItemInFolder(exportInfo.file);
          }}
        >
          {$t('Open file location')}
        </Button>
        <BottomRowButton
          colorRGB="255, 80, 164"
          icon="crossclip.png"
          description="Manually create vertical version for social media"
          buttonText="Edit in Crossclip"
          platform={EUploadPlatform.CROSSCLIP}
        />
        <BottomRowButton
          colorRGB="255, 81, 81"
          icon="video-editor.png"
          description="Full fletched video editing, collaboration and more"
          buttonText="Edit in Video Editor"
          platform={EUploadPlatform.VIDEOEDITOR}
        />
        <BottomRowButton
          colorRGB="94, 229, 124"
          icon="podcast-editor.png"
          description="Subtitles, transcripts, translations and more"
          buttonText="Edit in Podcast Editor"
          platform={EUploadPlatform.TYPESTUDIO}
        />
      </div>
    </div>
  );
}

function BottomRowButton({
  colorRGB,
  icon,
  buttonText,
  description,
  platform,
}: {
  colorRGB: string;
  icon: string;
  buttonText: string;
  description: string;
  platform: EUploadPlatform;
}) {
  const { HighlighterService } = Services;

  const { uploadInfo } = useVuex(() => ({
    uploadInfo: HighlighterService.getUploadInfo(HighlighterService.views.uploadInfo, platform),
  }));
  return (
    <div
      className={styles.bottomRowButton}
      style={{ '--color-rgb': colorRGB } as React.CSSProperties}
    >
      <img style={{ width: '24px', height: '24px' }} src={$i(`images/products/${icon}`)} />
      {!uploadInfo?.uploading && (
        <>
          <p>{description}</p>
        </>
      )}
      <StorageUpload onClose={() => {}} platform={platform} />
    </div>
  );
}
