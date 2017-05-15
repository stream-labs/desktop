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
    <button
      class="button button--default button--md studioFooter-button studioFooter-button--startStreaming"
      @click="toggleStreaming">
      {{ streamButtonLabel }}
    </button>
  </div>
</div>
</template>

<script>
import moment from 'moment';
import _ from 'lodash';
import SettingsService from '../services/settings';
import StreamingService from '../services/streaming';
import PerformanceService from '../services/performance';

export default {

  data() {
    return {
      streamElapsed: '',
      recordElapsed: ''
    };
  },

  beforeCreate() {
    this.settingsService = SettingsService.instance;
    this.settingsService.loadSettingsIntoStore();
    this.streamingService = StreamingService.instance;
    this.performanceService = PerformanceService.instance;
  },

  mounted() {
    this.timersInterval = setInterval(() => {
      if (this.streaming) {
        this.streamElapsed = this.elapsedStreamTime;
      }

      if (this.recording) {
        this.recordElapsed = this.elapsedRecordTime;
      }
    }, 100);
  },

  beforeDestroy() {
    clearInterval(this.timersInterval);
  },

  methods: {
    toggleStreaming() {
      if (this.streaming) {
        this.stopStreaming();

        const keepRecording = this.settingsService.state.General.KeepRecordingWhenStreamStops;

        if (!keepRecording && this.recording) {
          this.stopRecording();
        }
      } else {
        this.startStreaming();

        const recordWhenStreaming = this.settingsService.state.General.RecordWhenStreaming;

        if (recordWhenStreaming && !this.recording) {
          this.startRecording();
        }
      }
    },

    startStreaming() {
      const shouldConfirm = this.settingsService.state.General.WarnBeforeStartingStream;
      const confirmText = 'Are you sure you want to start streaming?';

      if ((shouldConfirm && confirm(confirmText)) || !shouldConfirm) {
        this.streamingService.startStreaming();
      }
    },

    stopStreaming() {
      const shouldConfirm = this.settingsService.state.General.WarnBeforeStoppingStream;
      const confirmText = 'Are you sure you want to stop streaming?';

      if ((shouldConfirm && confirm(confirmText)) || !shouldConfirm) {
        this.streamingService.stopStreaming();
      }
    },

    toggleRecording() {
      if (this.recording) {
        this.streamingService.stopRecording();
      } else {
        this.streamingService.startRecording();
      }
    },

    formattedDurationSince(timestamp) {
      const duration = moment.duration(moment() - timestamp);
      const seconds = _.padStart(duration.seconds(), 2, 0);
      const minutes = _.padStart(duration.minutes(), 2, 0);
      const hours = _.padStart(duration.hours(), 2, 0);

      return `${hours}:${minutes}:${seconds}`;
    }
  },

  computed: {
    streaming() {
      return this.streamingService.isStreaming;
    },

    streamStatusMsg() {
      if (this.streaming && this.streamOk !== null) {
        if (this.streamOk) {
          return 'Stream OK';
        }

        return 'Stream Error';
      }

      return null;
    },

    streamStartTime() {
      return this.streamingService.streamStartTime;
    },

    streamButtonLabel() {
      if (this.streaming) {
        return this.streamElapsed;
      }

      return 'Start Streaming';
    },

    elapsedStreamTime: {
      cache: false,
      get() {
        return this.formattedDurationSince(this.streamStartTime);
      }
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
        return this.formattedDurationSince(this.recordStartTime);
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
