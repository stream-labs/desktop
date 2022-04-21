import React from 'react';
import cx from 'classnames';
import { SliderInput } from 'components-react/shared/inputs';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { AudioSource } from 'services/audio';
import { EditMenu } from 'util/menus/EditMenu';
import MixerVolmeter from './MixerVolmeter';
import styles from './MixerItem.m.less';

const SLIDER_METADATA = {
  min: 0,
  max: 1,
  interval: 0.01,
  displayValue: 'false',
  simpleTheme: true,
};

export default function MixerItem(p: { audioSource: AudioSource; volmetersEnabled?: boolean }) {
  const volmetersEnabled = p.volmetersEnabled ?? true;

  const { CustomizationService, EditorCommandsService, SourcesService } = Services;

  const { performanceMode, sourceName } = useVuex(() => ({
    performanceMode: CustomizationService.state.performanceMode,
    sourceName: SourcesService.state.sources[p.audioSource.sourceId].name,
  }));

  function setMuted(muted: boolean) {
    EditorCommandsService.actions.executeCommand(
      'MuteSourceCommand',
      p.audioSource.sourceId,
      muted,
    );
  }

  function onSliderChangeHandler(newVal: number) {
    EditorCommandsService.actions.executeCommand(
      'SetDeflectionCommand',
      p.audioSource.sourceId,
      newVal,
    );
  }

  function showSourceMenu(sourceId: string) {
    const menu = new EditMenu({
      selectedSourceId: sourceId,
      showAudioMixerMenu: true,
    });
    menu.popup();
  }

  const muted = p.audioSource.muted;

  return (
    <div className={cx(styles.mixerItem, { [styles.muted]: p.audioSource.muted })}>
      <div className="flex">
        <div className={styles.sourceName}>{sourceName}</div>
        <div className={styles.dbValue}>
          {p.audioSource.fader.deflection === 0 && <div>-Inf dB</div>}
          {p.audioSource.fader.deflection !== 0 && (
            <div>{p.audioSource.fader.db.toFixed(1)} dB</div>
          )}
        </div>
      </div>

      {!performanceMode && (
        <MixerVolmeter audioSource={p.audioSource} volmetersEnabled={volmetersEnabled} />
      )}

      <div className="flex">
        <SliderInput
          value={p.audioSource.fader.deflection}
          onInput={onSliderChangeHandler}
          {...SLIDER_METADATA}
        />
        <div className={styles.controls}>
          <i
            className={cx('icon-button', muted ? 'icon-mute' : 'icon-audio')}
            title={muted ? 'click to switch on' : 'click to switch off'}
            onClick={() => setMuted(!muted)}
          />
          <i
            className="icon-button icon-settings"
            onClick={() => showSourceMenu(p.audioSource.sourceId)}
          />
        </div>
      </div>
    </div>
  );
}
