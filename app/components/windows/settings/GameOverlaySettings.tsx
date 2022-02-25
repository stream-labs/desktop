import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import { metadata } from 'components/shared/inputs/index';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { GameOverlayService } from 'services/game-overlay/index';
import { Inject } from 'services/core/index';
import { $t } from 'services/i18n/index';

@Component({})
export default class GameOverlaySettings extends TsxComponent<{}> {
  @Inject() gameOverlayService!: GameOverlayService;

  enabling = false;
  overlayOpacity = this.gameOverlayService.state.opacity / 100;

  get enableGameOverlay() {
    return this.gameOverlayService.state.isEnabled;
  }

  async setEnableGameOverlay(val: boolean) {
    this.enabling = true;
    try {
      await this.gameOverlayService.setEnabled(val);
    } catch (e: unknown) {
      this.$toasted.show($t('Please log in to use the in-game overlay.'), {
        position: 'bottom-center',
        className: 'toast-alert',
        duration: 3000,
        singleton: true,
      });
    }
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

  get windowEnableToggles() {
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

  get extraOptions() {
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

  render() {
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
              {this.enableGameOverlay && this.windowEnableToggles}
              {this.enableGameOverlay && this.extraOptions}
              <div style="margin-bottom: 16px;">
                {$t('Set a hotkey in Hotkey Settings to toggle the in-game overlay')}
              </div>
              <div style="margin-bottom: 16px;">
                {$t(
                  'The in-game overlay is a new experimental feature that allows you to view chat and events ' +
                    'overlayed on top of your game.  This overlay may not work with certain games running in exclusive ' +
                    'fullscreen mode.  For best results, we recommend running your game in windowed-fullscreen mode.',
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}
