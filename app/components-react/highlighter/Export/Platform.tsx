import { Form, Dropdown, Button, Collapse, CollapseProps } from 'antd';
import { useVuex } from 'components-react/hooks';
import { useController } from 'components-react/hooks/zustand';
import { ListInput } from 'components-react/shared/inputs';
import React, { useState } from 'react';
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

export default function PlatformSelect({
  onClose,
  videoName,
  streamId,
}: {
  onClose: () => void;
  videoName: string;
  streamId: string | undefined;
}) {
  const { store, clearUpload, getStreamTitle, getClips, getDuration } = useController(
    ExportModalCtx,
  );
  const { UserService } = Services;
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
      children: <p>dsadsadas</p>,
    },
    {
      key: '2',
      label: 'This is panel header 2',
      children: <p>dsadsadas</p>,
    },
    {
      key: '3',
      label: 'This is panel header 3',
      children: <p>dsadsadas</p>,
    },
    {
      key: '4',
      label: 'dasdsdsadas',
      children: <p style={{ height: '120px', backgroundColor: 'green' }}>dsadsadas</p>,
    },
    {
      key: '5',
      label: 'This is panel header 3',
      children: <p style={{ height: '120px', backgroundColor: 'red' }}>dsadsadas</p>,
    },
    {
      key: '6',
      label: 'This is panel header 3',
      children: <p style={{ height: '120px', backgroundColor: 'red' }}>dsadsadas</p>,
    },
  ];

  return (
    <Form>
      <div className={styles.modalWrapper}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ fontWeight: 600, margin: 0 }}>{$t('Publish to')}</h2>{' '}
          <div>
            <Button type="text" onClick={close}>
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
              overflowY: 'auto',
            }}
          >
            <Collapse
              expandIconPosition="right"
              bordered={false}
              style={{ width: '100%', height: '424px' }}
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
                    backgroundColor: '#212c35',
                  }}
                >
                  {item.children}
                </Collapse.Panel>
              ))}
            </Collapse>
          </div>
        </div>
        <div className={styles.bottomRow}>
          <Button style={{ height: '100%', borderRadius: '8px' }}>primary</Button>
          <BottomRowButton
            colorRGB="255, 80, 164"
            icon="crossclip.png"
            description="Manually create vertical version for social media"
            buttonText="Edit in Crossclip"
          />
          <BottomRowButton
            colorRGB="255, 81, 81"
            icon="video-editor.png"
            description="Full fletched video editing, collaboration and more"
            buttonText="Edit in Video Editor"
          />
          <BottomRowButton
            colorRGB="94, 229, 124"
            icon="podcast-editor.png"
            description="Subtitles, transcripts, translations and more"
            buttonText="Edit in Podcast Editor"
          />
        </div>

        {/* <h1 style={{ display: 'inline', marginRight: '16px', position: 'relative', top: '3px' }}>
          {$t('Upload To')}
        </h1> */}

        {/* <ListInput
          value={platform}
          onChange={handlePlatformSelect}
          nowrap
          options={platformOptions}
        />
        {platform === 'youtube' && (
          <YoutubeUpload defaultTitle={videoName} close={onClose} streamId={streamId} />
        )}
        {platform !== 'youtube' && <StorageUpload onClose={onClose} platform={platform} />} */}
      </div>
    </Form>
  );
}

function BottomRowButton({
  colorRGB,
  icon,
  buttonText,
  description,
}: {
  colorRGB: string;
  icon: string;
  buttonText: string;
  description: string;
}) {
  return (
    <div
      className={styles.bottomRowButton}
      style={{ '--color-rgb': colorRGB } as React.CSSProperties}
    >
      <img style={{ width: '24px', height: '24px' }} src={$i(`images/products/${icon}`)} />
      <p>{description}</p>
      <a
      // onClick={() => {
      //   remote.shell.showItemInFolder(exportInfo.file);
      // }}
      >
        {buttonText}
      </a>
    </div>
  );
}
