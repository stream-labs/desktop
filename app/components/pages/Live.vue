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
          <div class="output-container">
            <div class="flex__item output studio-editor-display" ref=display>
            </div>
            <!-- status and viewer counts here-->
            <div class="stream-stats">
              <span>{{ streamStatus }}</span>
              <span>{{ streamCCU }}</span>
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
import { Inject } from '../../services/service';
import StreamingService from '../../services/streaming';
import { getPlatformService } from '../../services/platforms';
import StudioFooter from '../StudioFooter.vue';
import { ScenesService } from '../../services/scenes';
import { Display, VideoService } from '../../services/video';
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

  streamInfo = {status: '', viewers:0};
  streamInfoInterval: number;

  obsDisplay: Display;

  $refs: {
    display: HTMLElement
  };

  mounted() {
    this.streamInfoInterval = setInterval(
      () => {
        //Avoid hitting Twitch API if user is not streaming
        if (this.streamingService.isStreaming) {
          const platform = this.userService.platform.type;
          const platformId = this.userService.platformId;
          const service = getPlatformService(platform);

          service.fetchLiveStreamInfo(platformId).then((streamInfo: any) => {
            if (streamInfo && streamInfo.stream) {
              this.streamInfo.status = streamInfo.stream.channel.status;
              this.streamInfo.viewers = streamInfo.stream.viewers;
            }
          });
        }
      },
      30 * 1000
    );

    this.obsDisplay = this.videoService.createDisplay();

    this.scenesService.activeScene.makeItemActive(null);

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

  //getters

  get recenteventsUrl() {
    return this.userService.widgetUrl('recent-events');
  }

  get streamStatus() {
    return this.streamInfo.status;
  }

  get streamCCU() {
    return this.streamInfo.viewers;
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

.live-left, .live-right {
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
  .border;
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

.output {
  height: 240px;
}

.stream-stats {
  display: flex;
  justify-content: flex-end;
  padding: 10px 12px;

  span:first-child {
    margin-right: 20px;
  }
}

.chat-container {
  flex: 1;
}

.chat-wrapper {
  height: 100%;
}

.studio-editor-display {
  position: relative;
}

.night-theme {
  .mission-control-container {
    border-color: @night-secondary;
  }

  .output-container {
    background-color: @night-secondary;
    border-color: @night-secondary;
  }
}
</style>
