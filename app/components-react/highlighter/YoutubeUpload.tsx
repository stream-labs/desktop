import React, { useState, useEffect } from 'react';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { TextInput, TextAreaInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import path from 'path';
import { Button, Progress, Tooltip, Alert } from 'antd';
import { RadioInput } from 'components-react/shared/inputs/RadioInput';
import { TPrivacyStatus } from 'services/platforms/youtube/uploader';
import electron from 'electron';
import { $t } from 'services/i18n';

// Source: https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string/10420404
function humanFileSize(bytes: number, si: boolean) {
  const thresh = si ? 1000 : 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }
  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return bytes.toFixed(1) + ' ' + units[u];
}

export default function YoutubeUpload(props: { defaultTitle: string; close: () => void }) {
  const [title, setTitle] = useState(props.defaultTitle);
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('private');
  const [urlCopied, setUrlCopied] = useState(false);
  const { UserService, HighlighterService, NavigationService, UsageStatisticsService } = Services;
  const v = useVuex(() => ({
    youtubeLinked: !!UserService.state.auth?.platforms.youtube,
    uploadInfo: HighlighterService.views.uploadInfo,
    exportInfo: HighlighterService.views.exportInfo,
  }));
  const filename = path.parse(v.exportInfo.file).base;

  // Clear all errors when this component unmounts
  useEffect(() => {
    return () => HighlighterService.actions.dismissError();
  }, []);

  function getYoutubeForm() {
    return (
      <div>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          {v.youtubeLinked && (
            <div style={{ flexGrow: 1 }}>
              <Form layout="vertical">
                <TextInput label={$t('Title')} value={title} onChange={setTitle} />
                <TextAreaInput
                  label={$t('Description')}
                  value={description}
                  onChange={setDescription}
                />
                <RadioInput
                  label={$t('Privacy Status')}
                  options={[
                    {
                      label: $t('Private'),
                      value: 'private',
                      description: $t('Only you and people you choose can watch your video'),
                    },
                    {
                      label: $t('Unlisted'),
                      value: 'unlisted',
                      description: $t('Anyone with the video link can watch your video'),
                    },
                    {
                      label: $t('Public'),
                      value: 'public',
                      description: $t('Everyone can watch your video'),
                    },
                  ]}
                  value={privacy}
                  onChange={setPrivacy}
                />
              </Form>
            </div>
          )}
          {!v.youtubeLinked && (
            <div style={{ flexGrow: 1 }}>
              <div>
                {$t('Please connect your YouTube account to upload your video to YouTube.')}
              </div>
              <button
                style={{ marginTop: 8 }}
                className="button button--youtube"
                onClick={() =>
                  NavigationService.actions.navigate('PlatformMerge', {
                    platform: 'youtube',
                    highlighter: true,
                  })
                }
              >
                {$t('Connect')}
              </button>
            </div>
          )}
          <div
            style={{
              width: 300,
              marginLeft: 24,
              marginBottom: 24,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <video
              src={HighlighterService.views.getCacheBustingUrl(v.exportInfo.file)}
              controls
              style={{
                width: '100%',
                borderTopRightRadius: 8,
                borderTopLeftRadius: 8,
                outline: 'none',
              }}
            />
            <div
              style={{
                borderBottomLeftRadius: 8,
                borderBottomRightRadius: 8,
                background: 'var(--section)',
                fontWeight: 800,
                padding: 12,
              }}
            >
              {filename}
              <br />
              <a
                onClick={() => {
                  electron.remote.shell.showItemInFolder(v.exportInfo.file);
                }}
              >
                {$t('Open file location')}
              </a>
            </div>
          </div>
        </div>
        {v.uploadInfo.error && (
          <Alert
            style={{ marginBottom: 24 }}
            message={$t('An error occurred while uploading to YouTube')}
            type="error"
            closable
            showIcon
            afterClose={() => HighlighterService.actions.dismissError()}
          />
        )}
        <div style={{ textAlign: 'right' }}>
          <Button style={{ marginRight: 8 }} onClick={props.close}>
            {$t('Close')}
          </Button>
          {v.youtubeLinked && (
            <Button
              type="primary"
              onClick={() => {
                UsageStatisticsService.actions.recordFeatureUsage('HighlighterUpload');
                HighlighterService.actions.upload({
                  title,
                  description,
                  privacyStatus: privacy as TPrivacyStatus,
                });
              }}
            >
              {$t('Publish')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  function getUploadProgress() {
    return (
      <div>
        <h2>{$t('Upload Progress')}</h2>
        <Progress
          percent={Math.round((v.uploadInfo.uploadedBytes / v.uploadInfo.totalBytes) * 100)}
          trailColor="var(--section)"
          status={v.uploadInfo.cancelRequested ? 'exception' : 'normal'}
        />
        {!v.uploadInfo.cancelRequested && (
          <div>
            {$t('Uploading: %{uploadedBytes}/%{totalBytes}', {
              uploadedBytes: humanFileSize(v.uploadInfo.uploadedBytes, false),
              totalBytes: humanFileSize(v.uploadInfo.totalBytes, false),
            })}
          </div>
        )}
        {v.uploadInfo.cancelRequested && <span>{$t('Canceling...')}</span>}
        <br />
        <button
          className="button button--soft-warning"
          onClick={() => HighlighterService.actions.cancelUpload()}
          style={{ marginTop: '16px' }}
          disabled={v.uploadInfo.cancelRequested}
        >
          {$t('Cancel')}
        </button>
      </div>
    );
  }

  function getUploadDone() {
    const url = `https://youtube.com/watch?v=${v.uploadInfo.videoId}`;

    return (
      <div>
        <p>
          {$t(
            'Your video was successfully uploaded! Click the link below to access your video. Please note that YouTube will take some time to process your video.',
          )}
        </p>
        <br />
        <a onClick={() => electron.remote.shell.openExternal(url)}>{url}</a>
        <Tooltip placement="right" title={urlCopied ? 'Copied!' : 'Copy URL'}>
          <i
            className="icon-copy link"
            style={{ marginLeft: 8, display: 'inline', cursor: 'pointer' }}
            onClick={() => {
              setUrlCopied(true);
              electron.clipboard.writeText(url);
            }}
          />
        </Tooltip>
      </div>
    );
  }

  return (
    <div>
      <h2>{$t('Upload to YouTube')}</h2>
      {!v.uploadInfo.uploading && !v.uploadInfo.videoId && getYoutubeForm()}
      {v.youtubeLinked && v.uploadInfo.uploading && getUploadProgress()}
      {v.youtubeLinked && v.uploadInfo.videoId && getUploadDone()}
    </div>
  );
}
