import { Services } from 'components-react/service-provider';
import React, { useEffect, useState } from 'react';
import { $t } from 'services/i18n';
import { IThemeMetadata } from 'services/onboarding';
import commonStyles from './Common.m.less';
import styles from './ThemeSelector.m.less';
import cx from 'classnames';
import { useModule } from 'components-react/hooks/useModule';
import { OnboardingModule } from './Onboarding';
import AutoProgressBar from 'components-react/shared/AutoProgressBar';

export function ThemeSelector() {
  const { OnboardingService, SceneCollectionsService } = Services;
  const [themesMetadata, setThemesMetadata] = useState<IThemeMetadata[]>([]);
  const [installing, setInstalling] = useState(false);
  const [showDetail, setShowDetail] = useState<number | null>(null);
  const [bigPreview, setBigPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const detailIndex = themesMetadata.findIndex(theme => theme.data.id === showDetail);
  const detailTheme = themesMetadata[detailIndex];
  const { setProcessing, next } = useModule(OnboardingModule).select();

  function getFilteredMetadata() {
    if (!showDetail) return themesMetadata;
    if ([2, 5].includes(detailIndex)) {
      return [themesMetadata[0], themesMetadata[3]];
    } else {
      return [themesMetadata[2], themesMetadata[5]];
    }
  }

  function previewImages(theme: IThemeMetadata) {
    if (!theme?.data) return [];
    return Object.values(theme.data.custom_images).slice(0, 3);
  }

  function focusTheme(theme: IThemeMetadata | null) {
    if (!theme) {
      setShowDetail(null);
      setBigPreview(null);
    } else {
      setShowDetail(theme.data.id);
      setBigPreview(previewImages(theme)[0]);
    }
  }

  function thumbnail(theme: any) {
    return previewImages(theme).find((img: string) => /\.png$|\.jpg$|\.jpeg$/.test(img));
  }

  async function installTheme(event: React.MouseEvent) {
    event.stopPropagation();
    const url = OnboardingService.themeUrl(detailTheme.data.id);
    setInstalling(true);
    setProcessing(true);
    const sub = SceneCollectionsService.downloadProgress.subscribe(progress =>
      setProgress(progress.percent * 100),
    );
    await SceneCollectionsService.installOverlay(url, detailTheme.data.name);
    sub.unsubscribe();
    setInstalling(false);
    setProcessing(false);
    next();
  }

  useEffect(() => {
    OnboardingService.actions.return.fetchThemes().then(themes => {
      console.log(themes);
      setThemesMetadata(themes);
    });
  }, []);

  return (
    <div style={{ width: '100%' }}>
      <h1 className={commonStyles.titleContainer}>{$t('Add a Theme')}</h1>
      <div>
        {!installing ? (
          <div className={styles.container}>
            {getFilteredMetadata().map(theme => (
              <div className={styles.cell} onClick={() => focusTheme(theme)}>
                <img className={styles.thumbnail} src={thumbnail(theme)} />
                <div className={styles.title}>{theme.data.name}</div>
              </div>
            ))}
            {showDetail && bigPreview && (
              <div
                className={cx(
                  styles.detailPanel,
                  [2, 5].includes(detailIndex) ? styles.right : styles.left,
                )}
                onClick={() => focusTheme(null)}
              >
                <div className={styles.detailHeader}>
                  <h1>{detailTheme.data.name}</h1>
                  <button
                    className={cx('button button--action', commonStyles.onboardingButton)}
                    onClick={e => installTheme(e)}
                  >
                    {$t('Install')}
                  </button>
                  <i className="icon-close" />
                </div>
                <div className={styles.previewGrid}>
                  <ThemePreview
                    src={bigPreview}
                    className={styles.bigPreview}
                    focusPreview={() => {}}
                  />
                  {previewImages(detailTheme).map(src => {
                    return (
                      <ThemePreview
                        key={src}
                        src={src}
                        className={cx(styles.preview, { [styles.active]: src === bigPreview })}
                        focusPreview={() => setBigPreview(src)}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.progressBar}>
            <p>{$t('Installing theme...')}</p>
            <AutoProgressBar percent={progress} timeTarget={60 * 1000} />
          </div>
        )}
      </div>
    </div>
  );
}

function ThemePreview(p: { src: string; className: string; focusPreview: () => void }) {
  const isVideo = /\.mp4$/.test(p.src);
  return isVideo ? (
    <video
      autoPlay
      muted
      loop
      src={p.src}
      className={p.className}
      onClick={e => {
        e.stopPropagation();
        p.focusPreview();
      }}
    />
  ) : (
    <img
      src={p.src}
      className={p.className}
      onClick={e => {
        e.stopPropagation();
        p.focusPreview();
      }}
    />
  );
}
