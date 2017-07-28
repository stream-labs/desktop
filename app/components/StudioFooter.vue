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
        @click="toggleRecording"
        :class="{ active: streamingService.isRecording }">
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
import { NavigationService } from "../services/navigation";

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
  padding: 10px 20px;
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
  border-radius: 100%;
  opacity: .4;
  .transition;

  .fa-circle {
    top: 4px;
    left: 4px;
    font-size: 20px;
  }

  &:hover {
    opacity: 1;
  }

  &.active {
    opacity: 1;
    animation: pulse 2.5s infinite;
  }
}

@keyframes pulse {
  0% {
    transform: scale(.7);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(.7);
  }
}

.night-theme {
  .footer {
    background-color: @night-primary;
    border-color: @night-border;
  }
}
</style>
