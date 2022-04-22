import React from 'react';
import cx from 'classnames';
import { SliderInput } from 'components-react/shared/inputs';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { AudioSource } from 'services/audio';
import { EditMenu } from 'util/menus/EditMenu';
import MixerVolmeter from './MixerVolmeter';
import styles from './MixerItem.m.less';
import { cloneDeep } from 'lodash';

const SLIDER_METADATA = {
  min: 0,
  max: 1,
  interval: 0.01,
  style: { flexGrow: 1 },
};

export default function MixerItem(p: { audioSourceId: string; volmetersEnabled?: boolean }) {
  const volmetersEnabled = p.volmetersEnabled ?? true;

  const { CustomizationService, EditorCommandsService, SourcesService, AudioService } = Services;

  const { performanceMode, sourceName, muted, deflection, db } = useVuex(() => ({
    performanceMode: CustomizationService.state.performanceMode,
    sourceName: SourcesService.state.sources[p.audioSourceId].name,
    muted: AudioService.views.getSource(p.audioSourceId).muted,
    deflection: AudioService.views.getSource(p.audioSourceId).fader.deflection,
    db: AudioService.views.getSource(p.audioSourceId).fader.db,
  }));

  function setMuted() {
    EditorCommandsService.actions.executeCommand('MuteSourceCommand', p.audioSourceId, !muted);
  }

  function onSliderChangeHandler(newVal: number) {
    EditorCommandsService.actions.executeCommand('SetDeflectionCommand', p.audioSourceId, newVal);
  }

  function showSourceMenu(sourceId: string) {
    const menu = new EditMenu({
      selectedSourceId: sourceId,
      showAudioMixerMenu: true,
    });
    menu.popup();
  }

  return (
    <div className={cx(styles.mixerItem, { [styles.muted]: muted })}>
      <div className="flex">
        <div className={styles.sourceName}>{sourceName}</div>
        <div className={styles.dbValue}>
          {deflection === 0 && <div>-Inf dB</div>}
          {deflection !== 0 && <div>{db.toFixed(1)} dB</div>}
        </div>
      </div>

      {!performanceMode && (
        <MixerVolmeter audioSourceId={p.audioSourceId} volmetersEnabled={volmetersEnabled} />
      )}

      <div className="flex">
        <SliderInput
          value={deflection}
          onInput={onSliderChangeHandler}
          min={0}
          max={1}
          step={0.01}
          style={{ flexGrow: 1 }}
          uncontrolled
        />
        <div className={styles.controls}>
          <i
            className={cx('icon-button', muted ? 'icon-mute' : 'icon-audio')}
            title={muted ? 'click to switch on' : 'click to switch off'}
            onClick={setMuted}
          />
          <i
            className="icon-button icon-settings"
            onClick={() => showSourceMenu(p.audioSourceId)}
          />
        </div>
      </div>
    </div>
  );
}
