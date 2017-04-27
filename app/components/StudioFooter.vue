<template>
<div class="studioFooter">
  <div>
    CPU: {{ cpuPercent }}%
    {{ streamStatusMsg }}
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
import Obs from '../api/Obs';
import StreamingService from '../services/streaming';

export default {

  data() {
    return {
      streamElapsed: '',
      recordElapsed: '',
      cpuPercent: 0
    };
  },

  beforeCreate() {
    this.streamingService = StreamingService.instance;
  },

  mounted() {
    this.cpuInterval = setInterval(() => {
      this.cpuPercent = Obs.getPerformanceStatistics()[0].CPU;
    }, 2000);
  },

  beforeDestroy() {
    clearInterval(this.cpuInterval);
  },

  methods: {
    toggleStreaming() {
      if (this.streaming) {
        this.stopStreaming();
      } else {
        this.startStreaming();
      }
    },

    startStreaming() {
      this.streamingService.startStreaming();

      this.streamElapsed = '00:00:00';

      this.streamInterval = setInterval(() => {
        this.streamElapsed = this.elapsedStreamTime;
      }, 100);
    },

    stopStreaming() {
      this.streamingService.stopStreaming();

      clearInterval(this.streamInterval);
    },

    toggleRecording() {
      if (this.recording) {
        this.stopRecording();
      } else {
        this.startRecording();
      }
    },

    startRecording() {
      this.streamingService.startRecording();

      this.recordElapsed = '00:00:00';

      this.recordInterval = setInterval(() => {
        this.recordElapsed = this.elapsedRecordTime;
      }, 100);
    },

    stopRecording() {
      this.streamingService.stopRecording();

      clearInterval(this.recordInterval);
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
      return this.streamingService.state.isStreaming;
    },

    streamStatusMsg() {
      if (this.streaming && this.streamOk !== null) {
        if (this.streamOk) {
          return 'Stream OK';
        }

        return 'Stream Error';
      }

      return '';
    },

    streamStartTime() {
      return moment(this.streamingService.state.streamStartTime);
    },

    streamButtonLabel() {
      if (this.streaming) {
        return this.streamElapsed;
      }

      return 'Start Streaming';
    },

    streamOk() {
      return this.streamingService.state.streamOk;
    },

    elapsedStreamTime: {
      cache: false,
      get() {
        return this.formattedDurationSince(this.streamStartTime);
      }
    },

    recording() {
      return this.streamingService.state.isRecording;
    },

    recordStartTime() {
      return moment(this.streamingService.state.recordStartTime);
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
        return this.formattedDurationSince(this.recordStartTime);
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
