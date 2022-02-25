import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core';
import { GameOverlayService } from 'services/game-overlay';
import ModalLayout from '../ModalLayout.vue';
import { Display, StartStreamingButton } from 'components/shared/ReactComponentList';
import { StreamingService } from 'services/streaming';

@Component({ components: { Display, ModalLayout, StartStreamingButton } })
export default class OverlayWindow extends Vue {
  @Inject() private gameOverlayService: GameOverlayService;
  @Inject() private streamingService: StreamingService;

  get viewerCount() {
    return this.streamingService.views.viewerCount.toString();
  }

  get isPreviewEnabled() {
    return this.gameOverlayService.state.isPreviewEnabled;
  }
}
