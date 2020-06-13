import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core';
import { GameOverlayService } from 'services/game-overlay';
import { StreamInfoDeprecatedService } from 'services/stream-info-deprecated';
import ModalLayout from '../ModalLayout.vue';
import Display from 'components/shared/Display.vue';
import StartStreamingButton from '../StartStreamingButton.vue';

@Component({ components: { Display, ModalLayout, StartStreamingButton } })
export default class OverlayWindow extends Vue {
  @Inject() gameOverlayService: GameOverlayService;
  @Inject() streamInfoService: StreamInfoDeprecatedService;

  get viewerCount() {
    return this.streamInfoService.state.viewerCount.toString();
  }

  get isPreviewEnabled() {
    return this.gameOverlayService.state.isPreviewEnabled;
  }
}
