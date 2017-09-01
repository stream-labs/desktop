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
              <div class="stream-info__actions">
                <a
                  class="stream-info__more-info"
                  v-if="streamInfoExpanded == false"
                  @click="expandStreamInfo">
                  More Info</a>
                <a
                  :class="{hide: isExpanded}"
                  class="stream-info__more-info"
                  v-if="streamInfoExpanded == true"
                  @click="collapseStreamInfo">
                  Less Info</a>

                <span
                  class="stream-expand-preview icon-btn icon-btn--lg"
                  @click="expandOutput">
                  <i class="fa fa-expand" />
                </span>
              </div>

              <span class="stream-info__row">
                <span
                  class="stream-info__inputs stream-info__title"
                  v-if="editingStreamTitle">
                  <input class="input--transparent" v-model="streamTitle" type="text">
                  <i
                    v-if="!updatingStreamInfo"
                    @click="updateStreamInfo('title')"
                    class="fa fa-check teal" />
                  <i
                    v-if="updatingStreamInfo"
                    class="fa fa-spinner fa-pulse" />
                  <i
                    @click="cancelStreamTitle()"
                    class="fa fa-times warning" />
                </span>

                <span v-else>
                  <span class="stream-title">{{ streamStatus }}</span>
                  <span
                    class="stream__edit icon-btn"
                    @click="editStreamTitle()">
                    <i class="fa fa-pencil" />
                  </span>
                </span>
              </span>

              <span
                v-if="streamInfoExpanded"
                class="stream-viewer-stat stream-info__row">
                <i class="fa fa-user" /> {{ streamCCU }}
              </span>

              <div v-show="platform === 'twitch'">
                <span
                  v-if="streamInfoExpanded"
                  class="stream-info__row">
                  <span
                    class="stream-info__inputs"
                    v-if="editingStreamGame">
                    <ListInput
                      class="input-container--no-label input-container--no-margin input-wrapper--inverted"
                      :value="gameValues"
                      :allowEmpty="true"
                      placeholder="Search"
                      :loading="searchingGames"
                      @search-change="debouncedGameSeach"
                      @input="onGameInput"/>
                    <i
                      v-if="!updatingStreamInfo"
                      @click="updateStreamInfo('game')"
                      class="fa fa-check teal" />
                    <i
                      v-if="updatingStreamInfo"
                      class="fa fa-spinner fa-pulse" />
                    <i
                      @click="cancelStreamGame()"
                      class="fa fa-times warning" />
                  </span>

                  <span v-else>
                    <span class="stream-game">{{ streamGame }}</span>
                    <span
                      class="stream__edit icon-btn"
                      @click="editStreamGame()">
                      <i class="fa fa-pencil" />
                    </span>
                  </span>
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
import { ListInput } from '../shared/forms';
import { debounce } from 'lodash';

const { webFrame, screen } = electron;

interface GameInput {
  name: string;
  value: string;
  options: object[];
}


@Component({
  components: {
    SceneSelector,
    Mixer,
    Chat,
    StudioFooter,
    ListInput
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

  streamInfo: IStreamInfo = { status: 'Fetching Information', viewers: 0, game: 'Game' };

  streamTitle: string = '';

  status: boolean = true;

  streamInfoInterval: number;

  obsDisplay: Display;

  $refs: {
    display: HTMLElement
  };

  debouncedGameSeach: (search: string) => void;

  updatingStreamInfo = false;

  gameValues = {
    name: 'streamGame',
    value: 'My value',
    options: [
      { description: '', value: '' }
    ]
  };

  created() {
    this.debouncedGameSeach = debounce((search: string) => this.onGameSearchChange(search), 500);
  }

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

  onGameInput(gameInput: GameInput) {
    this.streamInfo.game = gameInput.value;
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
      this.streamInfoExpanded = true;
      this.editingStreamTitle = false;
      this.editingStreamGame = false;
    }
  }

  streamInfoExpanded = true;

  expandStreamInfo() {
    this.streamInfoExpanded = true;
  }

  collapseStreamInfo() {
    this.streamInfoExpanded = false;
  }

  editingStreamTitle = false;

  editStreamTitle() {
    this.editingStreamTitle = true;
  }

  cancelStreamTitle() {
    this.editingStreamTitle = false;
  }

  updateStreamInfo(field: string) {
    if (this.updatingStreamInfo) return;
    this.updatingStreamInfo = true;

    const platform = this.userService.platform.type;
    const platformId = this.userService.platformId;
    const oauthToken = this.userService.platform.token;
    const service = getPlatformService(platform);

    let streamTitle = this.streamInfo.status;
    let streamGame = this.streamInfo.game;

    if (field === 'title') {
      streamTitle = this.streamTitle;
    }

    service.putStreamInfo(streamTitle, streamGame, platformId, this.userService.platform.token).then(status => {
      this.updatingStreamInfo = false;

      if (status) {
        this.streamInfo.status = this.streamTitle;
        this.editingStreamTitle = false;
        this.editingStreamGame = false;
      } else {
        this.streamInfo.status = 'Error';
        this.editingStreamTitle = false;
        this.editingStreamGame = false;
      }
    });
  }

  editingStreamGame = false;

  editStreamGame() {
    this.editingStreamGame = true;
  }

  searchingGames = false;

  onGameSearchChange(searchString: string) {
    if (searchString !== '') {
      this.searchingGames = true;
      const platform = this.userService.platform.type;
      const service = getPlatformService(platform);

      this.gameValues.options = [];

      service.searchGames(searchString).then(games => {
        this.searchingGames = false;
        if (games && games.length) {
          games.forEach(game => {
            this.gameValues.options.push({description: game.name, value: game.name});
          });
        }
      });
    }
  }

  cancelStreamGame() {
    this.editingStreamGame = false;
  }

  fetchLiveStreamInfo() {
    //Avoid hitting Twitch API if user is not streaming
    if (this.streamingService.isStreaming) {
      const platform = this.userService.platform.type;
      const platformId = this.userService.platformId;
      const service = getPlatformService(platform);
      const oauthToken = this.userService.platform.token;

      service.fetchLiveStreamInfo(platformId, oauthToken).then(streamInfo => {
        this.streamInfo = streamInfo;
      });
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

  get streamGame() {
    return this.streamInfo.game;
  }

  get cpuPercent() {
    return this.performanceService.state.CPU;
  }

  get frameRate() {
    return this.performanceService.state.frameRate.toFixed(2);
  }

  get platform() {
    return this.userService.platform.type;
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
      bottom: 46px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .stream-info {
    flex-direction: row;
    position: absolute;
    right: 8px;
    left: 8px;
    bottom: 0;
  }

  .stream-info__row {
    margin-bottom: 0;
    margin-right: 40px;
  }

  .stream-info__row--editing {
    flex-direction: row-reverse;
  }

  .stream__edit {
    display: none;
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
  position: relative;

  .stream-info__row {
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.stream-info__actions {
  position: absolute;
  top: 10px;
  right: 12px;
}

.stream-info__more-info {
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: .4px
}

.stream-info-expanded {
  display: flex;
  flex-direction: column;
}

.stream-info__row {
  display: flex;
  align-items: center;
  margin-bottom: 2px;
}

.stream-info__row--editing {
  flex-direction: column-reverse;
  align-items: flex-start;
}

.stream-info__inputs {
  display: flex;
  align-items: center;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  margin-bottom: 6px;

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

.stream-info__title {
  width: 70%;
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
