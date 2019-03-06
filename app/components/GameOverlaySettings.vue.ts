import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { BoolInput } from './shared/inputs/inputs';
import { GameOverlayService } from 'services/game-overlay';
import { Inject } from 'util/injector';

@Component({ components: { BoolInput } })
export default class GameOverlaySettings extends Vue {
  @Inject() gameOverlayService: GameOverlayService;

  get enableGameOverlay() {
    return this.gameOverlayService.state.isEnabled;
  }

  set enableGameOverlay(val: boolean) {
    this.gameOverlayService.setEnabled(val);
  }

  get enablePreview() {
    return this.gameOverlayService.state.isPreviewEnabled;
  }

  set enablePreview(val: boolean) {
    this.gameOverlayService.setPreviewEnabled(val);
  }
}
