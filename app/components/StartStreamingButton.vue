<template>
<button
  class="button button--action button--md button--go-live"
  @click="toggleStreaming">
  {{ streamButtonLabel }}
</button>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import StreamingService from '../services/streaming';
import { Inject } from '../services/service';

@Component({})
export default class StartStreamingButton extends Vue {

  @Inject()
  streamingService: StreamingService;

  streamElapsed = '';
  elapsedInterval: number;

  mounted() {
    this.elapsedInterval = setInterval(
      () => {
        if (this.streamingService.isStreaming) {
          this.streamElapsed = this.getElapsedStreamTime();
        }
      },
      100
    );
  }

  beforeDestroy() {
    clearInterval(this.elapsedInterval);
  }

  toggleStreaming() {
    if (this.streamingService.isStreaming) {
      this.streamingService.stopStreaming();
    } else {
      this.streamingService.startStreaming();
    }
  }

  get streamButtonLabel() {
    if (this.streamingService.isStreaming) {
      return this.streamElapsed;
    }

    return 'Go Live';
  }

  getElapsedStreamTime() {
    return this.streamingService.formattedElapsedStreamTime;
  }

}
</script>

<style lang="less" scoped>
.button--go-live {
  width: 100px;
}
</style>
