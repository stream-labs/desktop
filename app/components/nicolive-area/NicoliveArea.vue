<template>
  <div class="root">
    <button
      @click="onToggle"
      class="nicolive-area-toggle-button"
      :class="{ 'nicolive-area--opened': opened }"
      v-if="!compactMode"
    >
      <ControlsArrow />
    </button>
    <div class="nicolive-area-container" v-if="opened || compactMode">
      <top-nav />
      <div class="program-area" :class="{ isCreate: !hasProgram }">
        <template v-if="hasProgram">
          <program-info class="program-area-item" />
          <tool-bar class="program-area-item" />
          <program-statistics class="program-area-item" />
          <area-switcher class="switch-area" :contents="contents">
            <template v-slot:commentViewer><comment-viewer /></template>
            <template v-slot:description><program-description /></template>
          </area-switcher>
        </template>
        <template v-else>
          <p class="message">
            <i class="icon-niconico"></i
            >このエリアではニコニコ生放送を<br />配信するための機能が利用できます
          </p>
          <div class="button-wrapper">
            <button
              class="button button--create-program"
              @click="createProgram"
              :disabled="isCreating"
            >
              新しく番組を作成する
            </button>
            <button
              class="button button--fetch-program"
              @click="fetchProgram"
              :disabled="isFetching"
            >
              作成済みの番組を取得する
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./NicoliveArea.vue.ts"></script>
<style lang="less" scoped>
@import '../../styles/index';

.root {
  display: flex;
  height: 100%;
  border-left: 1px solid @bg-secondary;
}

.nicolive-area-toggle-button {
  width: 16px;
  height: 180px;
  margin: auto 8px auto auto;
  background-color: @bg-primary;
  border-width: 1px 1px 1px 0;
  border-style: solid;
  border-color: @bg-secondary;

  > svg {
    width: 10px;
    height: 140px;
    fill: @text-primary;
    transition: 0.5s;
    transform: rotate(0deg);
  }

  &:hover {
    background-color: @bg-secondary;

    > svg {
      fill: @text-primary;
    }
  }

  &.nicolive-area--opened {
    > svg {
      transform: rotate(180deg);
    }
  }
}

.nicolive-area-container {
  width: 400px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  align-items: center;
  background-color: @bg-primary;
  border-left: 1px solid @bg-tertiary;
}

.program-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: center;

  &.isCreate {
    padding: 16px;
    align-items: center;
    background-color: @bg-secondary;

    .message {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: @text-secondary;
      text-align: center;
      margin-bottom: 40px;

      .icon-niconico {
        color: @text-secondary;
        font-size: 60px;
        margin-bottom: 16px;
      }
    }
  }
}

.program-area-item {
  flex-shrink: 0;
}

.button-wrapper {
  display: flex;
  flex-direction: column;
  min-width: 210px;
  padding-bottom: 72px;

  .button {
    width: 100%;

    & + .button {
      margin-top: 16px;
    }
  }
}

.switch-area {
  flex-grow: 1;
  flex-basis: 0;
}
</style>


