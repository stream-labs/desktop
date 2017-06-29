<template>
<div class="footer">
  <performance-metrics/>
  <div class="nav-right">
    <div class="nav-item">
      <test-widgets v-if="loggedIn" />
    </div>
    <div class="nav-item">
      <button
        class="record-button"
        @click="toggleRecording">
        <i class="fa fa-circle"/>
      </button>
    </div>
    <div class="nav-item">
      <start-streaming-button />
    </div>
  </div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../services/service';
import StreamingService from '../services/streaming';
import StartStreamingButton from './StartStreamingButton.vue';
import TestWidgets from './TestWidgets.vue';
import PerformanceMetrics from './PerformanceMetrics.vue';
import { UserService } from '../services/user';

@Component({
  components: {
    StartStreamingButton,
    TestWidgets,
    PerformanceMetrics
  }
})
export default class StudioFooterComponent extends Vue {

  @Inject()
  streamingService: StreamingService;

  @Inject()
  userService:UserService;

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

  get loggedIn() {
    return this.userService.isLoggedIn();
  }

}
</script>

<style lang="less" scoped>
@import "../styles/index";
.footer {
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  position: relative;
  padding: 10px 30px;
  background-color: @day-secondary;
  border-top: 1px solid @day-border;
  max-width: none;
}
.nav-right {
  display: flex;
  align-items: center;
}
.nav-item {
  margin-left: 20px;
}
.record-button {
  position: relative;
  width: 30px;
  height: 30px;
  color: @red;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid @red;
  border-radius: 100%;
  .fa-circle {
    top: 4px;
    left: 4px;
    font-size: 20px;
  }
}
.night-theme {
  .footer {
    background-color: @night-primary;
    border-color: @night-border;
  }
}
</style>
