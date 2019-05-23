import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import { metadata } from 'components/shared/inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import HotkeyGroup from 'components/HotkeyGroup';
import { GameOverlayService } from 'services/game-overlay';
import { Inject } from 'services/core';
import { $t } from 'services/i18n';
import { HotkeysService } from 'services/hotkeys';

@Component({})
export default class GameOverlaySettings extends TsxComponent<{}> {
  @Inject() gameOverlayService: GameOverlayService;
  @Inject() hotkeysService: HotkeysService;

  get enableGameOverlay() {
    return this.gameOverlayService.state.isEnabled;
  }

  setEnableGameOverlay(val: boolean) {
    this.gameOverlayService.setEnabled(val);
  }

  get enablePreview() {
    return this.gameOverlayService.state.isPreviewEnabled;
  }

  setEnablePreview(val: boolean) {
    this.gameOverlayService.setPreviewEnabled(val);
  }

  overlayTransparency = this.gameOverlayService.state.opacity / 100;

  setOverlayTransparency(value: number) {
    this.overlayTransparency = value;
    this.gameOverlayService.setOverlayOpacity(value * 100);
  }

  get sliderMetadata() {
    return metadata.slider({
      title: $t('Overlay Opacity'),
      min: 0,
      max: 1,
      interval: 0.1,
      usePercentages: true,
    });
  }

  get filteredHotkeySet() {
    return this.hotkeysService
      .getHotkeysSet()
      .general.filter(hotkey => /OVERLAY/.test(hotkey.actionName));
  }

  render(h: Function) {
    return (
      <div>
        <div class="section">
          <div class="section-content">
            <VFormGroup
              value={this.enableGameOverlay}
              onInput={this.setEnableGameOverlay}
              metadata={metadata.toggle({ title: $t('Enable in-game overlay') })}
            />
            <VFormGroup
              value={this.enablePreview}
              onInput={this.setEnablePreview}
              metadata={metadata.toggle({ title: $t('Enable stream preview in overlay') })}
            />
            {this.enableGameOverlay && (
              <VFormGroup
                metadata={this.sliderMetadata}
                value={this.overlayTransparency}
                onInput={this.setOverlayTransparency}
              />
            )}
            <HotkeyGroup title={$t('Overlay Hotkeys')} hotkeys={this.filteredHotkeySet} />
          </div>
        </div>
      </div>
    );
  }
}
