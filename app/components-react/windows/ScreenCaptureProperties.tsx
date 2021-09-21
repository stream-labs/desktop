import React, { useMemo, useState, useEffect } from 'react';
import electron from 'electron';
import { Services } from 'components-react/service-provider';
import styles from './ScreenCaptureProperties.m.less';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import Display from 'components-react/shared/Display';
import cx from 'classnames';
import { $t } from 'services/i18n';

interface ICapturableOption {
  description: string;
  value: string;
  thumbnail?: string;
  icon?: string;
  type: 'game' | 'window' | 'screen';
}

/**
 * Used for interacting with a capture source
 * @param sourceId The id of the source to manager
 * @example
 * const [captureOption, setCaptureOption, allCaptureOptions] = useCaptureSource(sourceId);
 */
function useCaptureSource(
  sourceId: string,
): [string, (opt: ICapturableOption) => void, ICapturableOption[]] {
  const { SourcesService } = Services;
  const source = SourcesService.views.getSource(sourceId);
  const [options, setOptions] = useState<ICapturableOption[]>([]);
  const [selected, setSelected] = useState<string>(source?.getSettings()['capture_source_list']);

  useEffect(() => {
    (async () => {
      const windows = await electron.desktopCapturer.getSources({
        types: ['window'],
        fetchWindowIcons: true,
      });
      const windowOptions = windows.map(win => {
        const opt: ICapturableOption = {
          description: win.name,
          value: win.id,
          thumbnail: win.thumbnail.toDataURL(),
          icon: win.appIcon?.toDataURL(),
          type: 'window',
        };

        return opt;
      });

      // Attempt to get thumbnails for screens
      const screenData = await electron.desktopCapturer.getSources({ types: ['screen'] });

      const screenOptions = electron.remote.screen.getAllDisplays().map((screen, index) => {
        const opt: ICapturableOption = {
          description: `Screen ${index + 1}`,
          value: `monitor:${index}`,
          thumbnail: screenData
            .find(s => s.display_id === screen.id.toString())
            ?.thumbnail?.toDataURL(),
          type: 'screen',
        };

        return opt;
      });

      setOptions([...screenOptions, ...windowOptions]);
    })();
  }, []);

  return [
    selected,
    (opt: ICapturableOption) => {
      // TODO: This is sync?
      source?.updateSettings({ capture_source_list: opt.value });
      setSelected(opt.value);
    },
    options,
  ];
}

export default function ScreenCaptureProperties() {
  const { WindowsService } = Services;
  const sourceId = useMemo(() => WindowsService.getChildWindowQueryParams().sourceId, []);
  const [captureOption, setCaptureOption, allCaptureOptions] = useCaptureSource(sourceId);

  function renderCaptureOption(opt: ICapturableOption) {
    return (
      <div
        className={cx(styles.captureItem, {
          [styles.captureItemSelected]: captureOption === opt.value,
        })}
        key={opt.value}
        onClick={() => setCaptureOption(opt)}
      >
        <img src={opt.thumbnail} />
        <div className={styles.captureItemThumbnailOverlay} />
        <div className={styles.captureItemText}>
          {opt.type === 'screen' && <i className="fas fa-desktop" style={{ marginRight: 8 }} />}
          {opt.type === 'window' && <img src={opt.icon} />}
          {opt.description}
        </div>
      </div>
    );
  }

  return (
    <ModalLayout
      scrollable
      fixedChild={<Display sourceId={sourceId} />}
      onOk={() => WindowsService.closeChildWindow()}
    >
      <div>
        <h2>{$t('Capture Game')}</h2>
        <h2>{$t('Capture Entire Screen')}</h2>
        <div className={styles.captureList}>
          {allCaptureOptions.filter(opt => opt.type === 'screen').map(renderCaptureOption)}
        </div>
        <h2>{$t('Capture Window')}</h2>
        <div className={styles.captureList}>
          {allCaptureOptions.filter(opt => opt.type === 'window').map(renderCaptureOption)}
        </div>
      </div>
    </ModalLayout>
  );
}
