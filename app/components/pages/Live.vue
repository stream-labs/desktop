<template>
<div>
  <div class="page-container">
    <div class="live-container">
      <div class="live-left">
        <div class="flex__column">
          <div class="flex__item mission-control-container">
            <webview class="mission-control" id="recentEventsWebview" :src="recenteventsUrl"></webview>
          </div>
          <div class="flex__item sources">
            <scene-selector class="studio-controls-panel small-6 columns no-padding-left" />
            <mixer class="studio-controls-panel small-6 columns no-padding-right" />
          </div>
        </div>
      </div>

      <div class="live-right">
        <div class="flex__column">

          <div
            class="output-container"
            :class="{ 'output-container--full': isExpanded }">

            <div class="output-wrapper">
              <div class="content">
                <div class="output" ref=display></div>
              </div>
            </div>

            <!-- live stream information -->
            <div class="stream-info">
              <div class="stream-info-wrapper">
                <span
                  class="stream-edit-title"
                  v-if="editingStreamTitle">
                  <input class="input--transparent" v-model="streamTitle" type="text">
                  <i
                    @click="updateStreamTitle()"
                    class="fa fa-check teal" />
                  <i
                    @click="cancelStreamTitle()"
                    class="fa fa-times warning" />
                </span>
                <span
                  class="stream-title-wrapper"
                  v-else>
                  <span class="stream-title">{{ streamStatus }}</span>
                  <span
                    class="stream-title__edit icon-btn"
                    @click="editStreamTitle()">
                    <i class="fa fa-pencil" />
                  </span>
                </span>
                <span
                  class="icon-btn icon-btn--lg"
                  @click="expandOutput">
                  <i class="fa fa-expand" />
                </span>
              </div>

              <div class="stream-info-wrapper stream-info-stats">
                <span class="stream-viewer-stat"><i class="fa fa-user" /> {{ streamCCU }}</span>
                <span>
                  <span class="stream-performance-stat">CPU: {{ cpuPercent }}%</span>
                  <span class="stream-performance-stat">{{ frameRate }} FPS</span>
                </span>
              </div>
            </div>
          </div>

          <div class="flex__item chat-container">
            <chat></chat>
          </div>
        </div>
      </div>
    </div>

    <div class="stream-footer">
      <studio-footer />
    </div>
  </div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import SceneSelector from '../SceneSelector.vue';
import Mixer from '../Mixer.vue';
import Chat from '../Chat.vue';
import { UserService } from '../../services/user';
import { Inject } from '../../util/injector';
import StreamingService from '../../services/streaming';
import { getPlatformService, IStreamInfo } from '../../services/platforms';
import StudioFooter from '../StudioFooter.vue';
import { ScenesService } from '../../services/scenes';
import { Display, VideoService } from '../../services/video';
import { PerformanceService } from '../../services/performance';
import electron from '../../vendor/electron';

const { webFrame, screen } = electron;

@Component({
  components: {
    SceneSelector,
    Mixer,
    Chat,
    StudioFooter
  }
})
export default class Live extends Vue {
  @Inject()
  userService: UserService;

  @Inject()
  streamingService: StreamingService;

  @Inject()
  scenesService: ScenesService;

  @Inject()
  videoService: VideoService;

  @Inject()
  performanceService: PerformanceService;

  streamInfo: IStreamInfo = { status: '', viewers: 0 };

  streamTitle: string = '';

  status: boolean = true;

  streamInfoInterval: number;

  obsDisplay: Display;

  $refs: {
    display: HTMLElement
  };

  mounted() {
    this.fetchLiveStreamInfo();
    this.streamInfoInterval = setInterval(this.fetchLiveStreamInfo, 30 * 1000);

    this.obsDisplay = this.videoService.createDisplay();

    this.obsDisplay.setShoulddrawUI(false);

    this.onResize();

    window.addEventListener('resize', this.onResize);
  }

  beforeDestroy() {
    clearInterval(this.streamInfoInterval);

    window.removeEventListener('resize', this.onResize);
    this.obsDisplay.destroy();
  }

  onResize() {
    const display = this.$refs.display;
    const rect = display.getBoundingClientRect();
    const factor = webFrame.getZoomFactor() * screen.getPrimaryDisplay().scaleFactor;

    this.obsDisplay.resize(
      rect.width * factor,
      rect.height * factor
    );

    this.obsDisplay.move(
      rect.left * factor,
      rect.top * factor
    );
  }

  isExpanded = false;

  expandOutput() {
    if(this.isExpanded) {
      this.isExpanded = false;
    } else {
      this.isExpanded = true;
    }
  }

  editingStreamTitle = false;

  editStreamTitle() {
    this.editingStreamTitle = true;
  }

  cancelStreamTitle() {
    this.editingStreamTitle = false;
  }

  updateStreamTitle() {
    const platform = this.userService.platform.type;
    const platformId = this.userService.platformId;
    const token = this.userService.platform.token;
    const service = getPlatformService(platform);

    service.putLiveStreamTitle(this.streamTitle, platformId, this.userService.platform.token).then(status => {
      if (status) {
        this.streamInfo.status = this.streamTitle;
        this.editingStreamTitle = false;
      } else {
        this.streamInfo.status = 'Error';
        this.editingStreamTitle = false;
      }
    });
  }

  fetchLiveStreamInfo() {
    {
      //Avoid hitting Twitch API if user is not streaming
      if (this.streamingService.isStreaming) {
        const platform = this.userService.platform.type;
        const platformId = this.userService.platformId;
        const service = getPlatformService(platform);

        service.fetchLiveStreamInfo(platformId).then(streamInfo => {
          this.streamInfo = streamInfo;
        });
      }
    }
  }

  //getters

  get recenteventsUrl() {
    return this.userService.widgetUrl('recent-events');
  }

  get streamStatus() {
    return this.streamInfo.status || 'Stream Offline';
  }

  get streamCCU() {
    return this.streamInfo.viewers;
  }

  get cpuPercent() {
    return this.performanceService.state.CPU;
  }

  get frameRate() {
    return this.performanceService.state.frameRate.toFixed(2);
  }

}
</script>

<style lang="less" scoped>
@import "../../styles/index";

.live-container {
  display: flex;
  height: 100%;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.live-left,
.live-right {
  display: flex;
}

.live-left {
  width: 70%;
  padding-right: 20px;
}

.live-right {
  flex: 1;
}

.mission-control-container {
  flex: 1;
  margin-bottom: 20px;
  .radius;
  overflow: hidden;
}

.mission-control {
  height: 100%;
}

.sources {
  height: 200px;
}

.output-container {
  margin-bottom: 20px;
  background-color: @day-secondary;
  .border;
  .radius;
  overflow: hidden;
}

.output-container--full {
  .absolute(0,0,57px,0);
  margin-bottom: 0;
  z-index: 10;

  .output-wrapper {
    position: static;
    margin: auto;
    display: flex;
    align-items: center;
    justify-content: center;

    .content {
      bottom: 62px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .stream-info {
    position: absolute;
    right: 8px;
    left: 8px;
    bottom: 0;
  }
}

.output-wrapper {
  .aspect-ratio(16,9);
}

.output {
  width: 100%;
  height: 100%;
}

.stream-info {
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
}

.stream-info-wrapper {
  display: flex;
  justify-content: space-between;

  &:first-child {
    margin-bottom: 4px;
  }
}

.stream-edit-title {
  display: flex;
  align-items: center;
  width: 80%;

  .fa {
    margin-left: 12px;
    opacity: .7;
    .transition;
    font-size: 14px;
    cursor: pointer;

    &:hover {
      opacity: 1;
    }
  }
}

.stream-title-wrapper {
  height: 26px;
  display: flex;
  align-items: center;
}

.stream-title {
  .semibold;
}

.stream-info-stats {
  color: @grey;
}

.stream-viewer-stat {
  .fa {
    margin-right: 4px;
  }
}

.stream-performance-stat {
  margin-left: 12px;
}

.chat-container {
  flex: 1;
}

.chat-wrapper {
  height: 100%;
}

.night-theme {
  .mission-control-container {
    border-color: @night-secondary;
  }

  .output-container {
    background-color: @night-secondary;
    border-color: @night-secondary;
  }

  .stream-title {
    color: @white;
  }
}
</style>
