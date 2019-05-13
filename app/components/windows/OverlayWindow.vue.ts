import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core';
import { GameOverlayService } from 'services/game-overlay';
import { StreamInfoService } from 'services/stream-info';
import ModalLayout from '../ModalLayout.vue';
import SceneSelector from '../SceneSelector.vue';
import Display from 'components/shared/Display.vue';
import StartStreamingButton from '../StartStreamingButton.vue';

@Component({ components: { Display, ModalLayout, SceneSelector, StartStreamingButton } })
export default class OverlayWindow extends Vue {
  @Inject() gameOverlayService: GameOverlayService;
  @Inject() streamInfoService: StreamInfoService;

  get viewerCount() {
    return this.streamInfoService.state.viewerCount.toString();
  }

  get isPreviewEnabled() {
    return this.gameOverlayService.state.isPreviewEnabled;
  }
}
