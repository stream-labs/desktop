<template>
<div class="studioFooter">
  <performance-metrics/>
  <div class="studioFooter-buttons text-right">
    <button
      class="button button--default button--md studioFooter-button studioFooter-button--startRecording"
      @click="toggleRecording">
      {{ recordButtonLabel }}
    </button>
  </div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../services/service';
import StreamingService from '../services/streaming';
import StartStreamingButton from './StartStreamingButton.vue';
import PerformanceMetrics from './PerformanceMetrics.vue';

@Component({
  components: {
    StartStreamingButton,
    PerformanceMetrics
  }
})
export default class StudioFooterComponent extends Vue {

  @Inject()
  streamingService: StreamingService;

  recordElapsed = '';
  timersInterval: number;

  mounted() {
    this.timersInterval = setInterval(() => {
      if (this.recording) {
        this.recordElapsed = this.elapsedRecordTime;
      }
    }, 100);
  }

  beforeDestroy() {
    clearInterval(this.timersInterval);
  }

  toggleRecording() {
    if (this.recording) {
      this.streamingService.stopRecording();
    } else {
      this.streamingService.startRecording();
    }
  }

  get recording() {
    return this.streamingService.isRecording;
  }

  get recordStartTime() {
    return this.streamingService.recordStartTime;
  }

  get recordButtonLabel() {
    if (this.recording) {
      return this.recordElapsed;
    }

    return 'Start Recording';
  }

  get elapsedRecordTime() {
    return this.streamingService.formattedElapsedRecordTime;
  }

}
</script>

<style lang="less" scoped>
.studioFooter {
  display: flex;
  flex-direction: row;
  align-items: center;

  padding: 0 40px;

  background-color: #fafafa;
  border-top: 1px solid #ddd;
}

.studioFooter-buttons {
  flex-grow: 1;
}

.studioFooter-button {
  width: 170px;
  margin: 10px 5px;
}

/* Button styles have to be overridden with !important */
.studioFooter-button--startRecording {
  color: #ff4141 !important;
}

.studioFooter-button--startStreaming {
  color: #644899 !important;
}
</style>
