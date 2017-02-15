<template>
<div class="studioFooter">
  <div>
    CPU STATS GO HERE
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

export default {

  data() {
    return {
      streamElapsed: '',
      recordElapsed: ''
    };
  },

  methods: {
    toggleStreaming() {
      if (this.streaming) {
        this.$store.dispatch({
          type: 'stopStreaming'
        });

        clearInterval(this.streamInterval);
      } else {
        this.$store.dispatch({
          type: 'startStreaming'
        });

        this.streamElapsed = '00:00:00';

        this.streamInterval = setInterval(() => {
          this.streamElapsed = this.elapsedStreamTime;
        }, 100);
      }
    },

    toggleRecording() {
      if (this.recording) {
        this.$store.dispatch({
          type: 'stopRecording'
        });

        clearInterval(this.recordInterval);
      } else {
        this.$store.dispatch({
          type: 'startRecording'
        });

        this.recordElapsed = '00:00:00';

        this.recordInterval = setInterval(() => {
          this.recordElapsed = this.elapsedRecordTime;
        }, 100);
      }
    },

    formattedDurationSince(timestamp) {
      const duration = moment.duration(moment() - timestamp);
      const seconds = _.padStart(duration.seconds(), 2, 0);
      const minutes = _.padStart(duration.minutes(), 2, 0);
      const hours = _.padStart(duration.hours(), 2, 0);

      return hours + ':' + minutes + ':' + seconds;
    }
  },

  computed: {
    streaming() {
      return this.$store.getters.isStreaming;
    },

    streamStartTime() {
      return this.$store.getters.streamStartTime;
    },

    streamButtonLabel() {
      if (this.streaming) {
        return this.streamElapsed;
      } else {
        return 'Start Streaming';
      }
    },

    elapsedStreamTime: {
      cache: false,
      get() {
        return this.formattedDurationSince(this.streamStartTime);
      }
    },

    recording() {
      return this.$store.getters.isRecording;
    },

    recordStartTime() {
      return this.$store.getters.recordStartTime;
    },

    recordButtonLabel() {
      if (this.recording) {
        return this.recordElapsed;
      } else {
        return 'Start Recording';
      }
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
