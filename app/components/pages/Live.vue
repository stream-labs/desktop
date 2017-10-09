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
                      @search-change="debouncedGameSearch"
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
              <div v-show="platform === 'twitch'">
                <span
                  v-if="streamInfoExpanded"
                  class="stream-info__row"
                  :class="{'stream-info__row--editing': editingStreamCommunities}">
                  <span class="stream-communities">
                    <span v-for="(community, i) in streamCommunities" class="stream-community">
                      {{ community.name }}
                      <i
                        v-if="editingStreamCommunities"
                        @click="removeCommunity(i)"
                        class="fa fa-times stream-community__remove"/>
                    </span>
                  </span>

                  <span
                    class="stream-info__inputs"
                    v-if="editingStreamCommunities">
                    <ListInput
                      class="input-container--no-label input-container--no-margin input-wrapper--inverted"
                      :value="communityValues"
                      :allowEmpty="true"
                      placeholder="Search"
                      :loading="searchingCommunities"
                      @search-change="debouncedCommunitySearch"
                      @input="onCommunityInput"/>
                    <i
                      v-if="!updatingStreamCommunity"
                      @click="updateStreamCommunities()"
                      class="fa fa-check teal" />
                    <i
                      v-if="updatingStreamCommunity"
                      class="fa fa-spinner fa-pulse" />
                    <i
                      @click="cancelStreamCommunities()"
                      class="fa fa-times warning" />
                  </span>

                  <span v-else>
                    <span
                      class="stream__edit icon-btn"
                      @click="editStreamCommunities()">
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

<script lang="ts" src="./Live.vue.ts"></script>

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

  .stream-communities[data-v-2c1d5f1c] {
    flex-wrap: nowrap;
    margin-left: 20px;
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


.stream-communities {
  display: flex;
  flex-wrap: wrap;
}

.stream-community {
  border: 1px solid @teal-med-opac;
  border-radius: 3px;
  padding: 0px 6px;
  color: @teal;
  background: @teal-light-opac;
  font-size: 12px;
  margin: 3px 10px 3px 0px;
  white-space: nowrap;
}

.stream-community__remove {
  margin-left: 6px;
  font-size: 10px;
  cursor: pointer;

  &:hover {
    color: @navy;
  }
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

  .stream-community__remove {
    &:hover {
      color: @white;
    }
  }
}
</style>
