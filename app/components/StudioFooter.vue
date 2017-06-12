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

<script>
import StreamingService from '../services/streaming.ts';
import StartStreamingButton from './StartStreamingButton.vue';
import PerformanceMetrics from './PerformanceMetrics.vue';

export default {

  components: { StartStreamingButton, PerformanceMetrics },

  data() {
    return {
      recordElapsed: ''
    };
  },

  beforeCreate() {
    this.streamingService = StreamingService.instance;
  },

  mounted() {
    this.timersInterval = setInterval(() => {
      if (this.recording) {
        this.recordElapsed = this.elapsedRecordTime;
      }
    }, 100);
  },

  beforeDestroy() {
    clearInterval(this.timersInterval);
  },

  methods: {
    toggleRecording() {
      if (this.recording) {
        this.streamingService.stopRecording();
      } else {
        this.streamingService.startRecording();
      }
    }
  },

  computed: {
    recording() {
      return this.streamingService.isRecording;
    },

    recordStartTime() {
      return this.streamingService.recordStartTime;
    },

    recordButtonLabel() {
      if (this.recording) {
        return this.recordElapsed;
      }

      return 'Start Recording';
    },

    elapsedRecordTime: {
      cache: false,
      get() {
        return this.streamingService.formattedElapsedRecordTime;
      }
    }
  }

};
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
