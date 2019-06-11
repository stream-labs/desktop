import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import { metadata } from 'components/shared/inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { GameOverlayService } from 'services/game-overlay';
import { Inject } from 'services/core';
import { $t } from 'services/i18n';

@Component({})
export default class GameOverlaySettings extends TsxComponent<{}> {
  @Inject() gameOverlayService: GameOverlayService;

  enabling = false;
  overlayOpacity = this.gameOverlayService.state.opacity / 100;

  get enableGameOverlay() {
    return this.gameOverlayService.state.isEnabled;
  }

  async setEnableGameOverlay(val: boolean) {
    this.enabling = true;
    await this.gameOverlayService.setEnabled(val);
    this.enabling = false;
  }

  get previewMode() {
    return this.gameOverlayService.state.previewMode;
  }

  togglePreviewMode() {
    this.gameOverlayService.setPreviewMode(!this.previewMode);
  }

  setOverlayOpacity(value: number) {
    this.overlayOpacity = value;
    this.gameOverlayService.setOverlayOpacity(value * 100);
  }

  resetPosition() {
    this.gameOverlayService.resetPosition();
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

  windowEnableToggles(h: Function) {
    const windows = Object.keys(this.gameOverlayService.state.windowProperties);
    const titles = { chat: $t('Show Chat'), recentEvents: $t('Show Recent Events') };
    return (
      <div>
        {windows.map(win => (
          <VFormGroup
            metadata={metadata.toggle({ title: titles[win] })}
            value={this.gameOverlayService.state.windowProperties[win].enabled}
            onInput={() => this.gameOverlayService.toggleWindowEnabled(win)}
          />
        ))}
      </div>
    );
  }

  extraOptions(h: Function) {
    return (
      <div>
        <VFormGroup
          value={this.previewMode}
          onInput={this.togglePreviewMode}
          metadata={metadata.toggle({ title: $t('Toggle positioning mode') })}
        />
        <VFormGroup
          metadata={this.sliderMetadata}
          value={this.overlayOpacity}
          onInput={this.setOverlayOpacity}
        />
        <button
          class="button button--action"
          onClick={this.resetPosition}
          style="margin-bottom: 16px;"
        >
          {$t('Reset Overlay Position')}
        </button>
      </div>
    );
  }

  render(h: Function) {
    return (
      <div>
        <div class="section">
          {!this.enabling && (
            <div class="section-content">
              <VFormGroup
                value={this.enableGameOverlay}
                onInput={this.setEnableGameOverlay}
                metadata={metadata.toggle({ title: $t('Enable in-game overlay') })}
              />
              {this.enableGameOverlay && this.windowEnableToggles(h)}
              {this.enableGameOverlay && this.extraOptions(h)}
              <div style="margin-bottom: 16px;">
                {$t('Set a hotkey in Hotkey Settings to toggle the in-game overlay')}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}
