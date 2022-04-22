import React, { useRef, useMemo } from 'react';
import { Tooltip } from 'antd';
import { Services } from 'components-react/service-provider';
import Scrollable from 'components-react/shared/Scrollable';
import { useVuex } from 'components-react/hooks';
import { $t } from 'services/i18n';
import { Menu } from 'util/menus/Menu';
import useBaseElement from './hooks';
import { MixerItem, GLVolmeters } from './mixer/index';

export default function Mixer() {
  const { AudioService, EditorCommandsService, CustomizationService } = Services;
  const containerRef = useRef<HTMLDivElement>(null);

  const { renderElement } = useBaseElement(<Element />, { x: 150, y: 120 }, containerRef.current);

  const { performanceMode, audioSources } = useVuex(() => ({
    performanceMode: CustomizationService.state.performanceMode,
    audioSources: AudioService.views.sourcesForCurrentScene.filter(
      source => !source.mixerHidden && source.isControlledViaObs,
    ),
  }));

  const needToRenderVolmeters: boolean = useMemo(() => {
    // render volmeters without hardware acceleration only if we don't have the webgl context
    const canvas = document.createElement('canvas');
    return !canvas.getContext('webgl');
  }, []);

  function showAdvancedSettings() {
    AudioService.actions.showAdvancedSettings();
  }

  function handleRightClick() {
    const menu = new Menu();
    menu.append({
      label: $t('Unhide All'),
      click: () => EditorCommandsService.actions.executeCommand('UnhideMixerSourcesCommand'),
    });
    menu.popup();
  }

  function Element() {
    return (
      <div onContextMenu={handleRightClick} style={{ height: '100%' }}>
        <div className="studio-controls-top">
          <Tooltip
            title={$t('Monitor audio levels. If the bars are moving you are outputting audio.')}
            placement="bottom"
          >
            <h2 className="studio-controls__label">{$t('Mixer')}</h2>
          </Tooltip>
          <Tooltip title={$t('Open advanced audio settings')} placement="left">
            <i className="icon-settings icon-button" onClick={showAdvancedSettings} />
          </Tooltip>
        </div>
        <Scrollable
          className="studio-controls-selector mixer-panel"
          style={{ height: 'calc(100% - 33px)' }}
        >
          <div style={{ position: 'relative' }}>
            {audioSources.length !== 0 && !performanceMode && <GLVolmeters />}
            {audioSources.map(audioSource => (
              <MixerItem
                audioSource={audioSource}
                key={audioSource.sourceId}
                volmetersEnabled={needToRenderVolmeters}
              />
            ))}
          </div>
        </Scrollable>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ height: '100%' }}>
      {renderElement()}
    </div>
  );
}
