import React, { useEffect } from 'react';
import * as remote from '@electron/remote';
import { Progress } from 'antd';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { humanFileSize } from './YoutubeUpload';
import { $t } from 'services/i18n';
import Translate from 'components-react/shared/Translate';

export default function CrossClipUpload(p: { onClose: () => void }) {
  const { UserService, HighlighterService, OnboardingService } = Services;

  const { uploadInfo, exportInfo, hasSLID } = useVuex(() => ({
    uploadInfo: HighlighterService.views.uploadInfo,
    exportInfo: HighlighterService.views.exportInfo,
    hasSLID: !!UserService.views.auth?.slid?.id,
  }));

  function UploadProgress() {
    return (
      <div>
        <h2>{$t('Upload Progress')}</h2>
        <Progress
          percent={Math.round((uploadInfo.uploadedBytes / uploadInfo.totalBytes) * 100)}
          trailColor="var(--section)"
          status={uploadInfo.cancelRequested ? 'exception' : 'normal'}
        />
        {!uploadInfo.cancelRequested && (
          <div>
            {$t('Uploading: %{uploadedBytes}/%{totalBytes}', {
              uploadedBytes: humanFileSize(uploadInfo.uploadedBytes, false),
              totalBytes: humanFileSize(uploadInfo.totalBytes, false),
            })}
          </div>
        )}
        {uploadInfo.cancelRequested && <span>{$t('Canceling...')}</span>}
        <br />
        <button
          className="button button--soft-warning"
          onClick={() => HighlighterService.actions.cancelUpload()}
          style={{ marginTop: '16px' }}
          disabled={uploadInfo.cancelRequested}
        >
          {$t('Cancel')}
        </button>
      </div>
    );
  }

  function connectSLID() {
    OnboardingService.actions.start({ isLogin: true });
  }

  // Clear all errors when this component unmounts
  useEffect(() => {
    return () => HighlighterService.actions.dismissError();
  }, []);

  if (!hasSLID) return <GetSLID onClick={connectSLID} />;
  if (uploadInfo.uploading) return <UploadProgress />;
  return (
    <button
      className="button button--action"
      onClick={() => HighlighterService.actions.uploadStorage()}
    >
      {$t('Upload')}
    </button>
  );
}

function GetSLID(p: { onClick: () => void }) {
  function signUp() {
    remote.shell.openExternal('https://id.streamlabs.com/register');
  }

  return (
    <div>
      <h2>{$t('This feature requires a Streamlabs ID')}</h2>
      <button className="button button--action" onClick={signUp}>
        {$t('Sign up for Streamlabs ID')}
      </button>
      <Translate message="Already have a Streamlabs ID? <link>Login</link>">
        <a slot="link" onClick={p.onClick} />
      </Translate>
    </div>
  );
}
