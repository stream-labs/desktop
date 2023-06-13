import React, { useEffect } from 'react';
import * as remote from '@electron/remote';
import cx from 'classnames';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { $t } from 'services/i18n';
import Translate from 'components-react/shared/Translate';
import UploadProgress from './UploadProgress';
import styles from './ExportModal.m.less';
import VideoPreview from './VideoPreview';

export default function StorageUpload(p: { onClose: () => void; platform: string }) {
  const { UserService, HighlighterService, OnboardingService, SharedStorageService } = Services;

  const { uploadInfo, hasSLID } = useVuex(() => ({
    uploadInfo: HighlighterService.views.uploadInfo,
    hasSLID: !!UserService.views.auth?.slid?.id,
  }));

  function connectSLID() {
    OnboardingService.actions.start({ isLogin: true });
  }

  function uploadStorage() {
    HighlighterService.actions.uploadStorage();
  }

  useEffect(() => {
    if (uploadInfo.videoId) {
      remote.shell.openExternal(
        SharedStorageService.views.getPlatformLink(p.platform, uploadInfo.videoId),
      );
      HighlighterService.actions.clearUpload();
      p.onClose();
    }
  }, [uploadInfo.videoId]);

  // Clear all errors when this component unmounts
  useEffect(() => {
    return () => HighlighterService.actions.dismissError();
  }, []);

  if (!hasSLID) return <GetSLID onClick={connectSLID} />;
  if (uploadInfo.uploading) return <UploadProgress />;
  return (
    <div className={styles.crossclipContainer}>
      <VideoPreview />
      {!uploadInfo.videoId && (
        <button
          className={cx('button button--action', styles.uploadButton)}
          onClick={uploadStorage}
        >
          {$t('Upload')}
        </button>
      )}
    </div>
  );
}

export function GetSLID(p: { onClick: () => void }) {
  function signUp() {
    remote.shell.openExternal('https://id.streamlabs.com/register');
  }

  return (
    <div className={styles.crossclipContainer}>
      <h2 className={styles.signUpTitle}>{$t('This feature requires a Streamlabs ID')}</h2>
      <button
        className="button button--action"
        style={{ width: '300px', margin: '32px' }}
        onClick={signUp}
      >
        {$t('Sign up for Streamlabs ID')}
      </button>
      <span className={styles.login}>
        <Translate message="Already have a Streamlabs ID? <link>Login</link>">
          <a slot="link" onClick={p.onClick} />
        </Translate>
      </span>
    </div>
  );
}
