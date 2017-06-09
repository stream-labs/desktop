<template>
<div class="studioFooter">
  <div>
    {{ statusLine }}
  </div>
  <div class="studioFooter-buttons text-right">
    <button
      class="button button--default button--md studioFooter-button studioFooter-button--startRecording"
      @click="toggleRecording">
      {{ recordButtonLabel }}
    </button>
    <start-streaming-button class="studioFooter-button studioFooter-button--startStreaming"/>
  </div>
</div>
</template>

<script>
import _ from 'lodash';
import StreamingService from '../services/streaming.ts';
import PerformanceService from '../services/performance';
import StartStreamingButton from './StartStreamingButton.vue';

export default {

  components: { StartStreamingButton },

  data() {
    return {
      recordElapsed: ''
    };
  },

  beforeCreate() {
    this.streamingService = StreamingService.instance;
    this.performanceService = PerformanceService.instance;
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
    streamStatusMsg() {
      if (this.streamingService.isStreaming && this.streamOk !== null) {
        if (this.streamOk) {
          return 'Stream OK';
        }

        return 'Stream Error';
      }

      return null;
    },

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

    streamOk() {
      return this.streamingService.streamOk;
    },

    elapsedRecordTime: {
      cache: false,
      get() {
        return this.streamingService.formattedElapsedRecordTime;
      }
    },

    statusLine() {
      const line = [
        `CPU: ${this.cpuPercent}%`,
        `${this.frameRate} FPS`,
        `Dropped Frames: ${this.droppedFrames} (${this.percentDropped}%)`,
        `${this.bandwidth} kb/s`,
        this.streamStatusMsg
      ];

      return _.compact(line).join(' | ');
    },

    cpuPercent() {
      return this.performanceService.state.CPU;
    },

    frameRate() {
      return this.performanceService.state.frameRate.toFixed(2);
    },

    droppedFrames() {
      return this.performanceService.state.numberDroppedFrames;
    },

    percentDropped() {
      return (this.performanceService.state.percentageDroppedFrames || 0).toFixed(1);
    },

    bandwidth() {
      return this.performanceService.state.bandwidth.toFixed(0);
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
