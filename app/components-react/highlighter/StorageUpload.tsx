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
import { EPlatformCallResult } from 'services/platforms';

export default function StorageUpload(p: { onClose: () => void; platform: string }) {
  const { UserService, HighlighterService, SharedStorageService } = Services;

  const { uploadInfo, hasSLID } = useVuex(() => ({
    uploadInfo: HighlighterService.views.uploadInfo,
    hasSLID: !!UserService.views.auth?.slid?.id,
  }));

  function uploadStorage() {
    HighlighterService.actions.uploadStorage(p.platform);
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

  if (!hasSLID) return <GetSLID />;
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

export function GetSLID(p: { onLogin?: () => void }) {
  const { UserService, OnboardingService } = Services;

  async function clickLink(signup?: boolean) {
    let resp: EPlatformCallResult;
    const platform = UserService.views.platform?.type;

    if (UserService.views.isLoggedIn) {
      resp = await UserService.actions.return.startSLMerge();
    } else {
      resp = await UserService.actions.return.startSLAuth({ signup });
    }

    if (resp !== EPlatformCallResult.Success) return;
    if (platform) {
      UserService.actions.setPrimaryPlatform(platform);
    } else {
      OnboardingService.actions.start({ isLogin: true });
    }
    if (p.onLogin) p.onLogin();
  }

  return (
    <div className={styles.crossclipContainer}>
      <h2 className={styles.signUpTitle}>{$t('This feature requires a Streamlabs ID')}</h2>
      <button
        className="button button--action"
        style={{ width: '300px', margin: '32px' }}
        onClick={() => clickLink(true)}
      >
        {$t('Sign up for Streamlabs ID')}
      </button>
      <span className={styles.login}>
        <Translate message="Already have a Streamlabs ID? <link>Login</link>">
          <a slot="link" onClick={() => clickLink()} />
        </Translate>
      </span>
    </div>
  );
}
