<template>
  <div class="root">
    <button
      @click="onToggle"
      class="nicolive-area-toggle-button"
      :class="{ 'nicolive-area--opened': opened }"
      v-if="!isCompactMode"
    >
      <i class="icon-drop-down-arrow"></i>
    </button>
    <div class="nicolive-area-container" v-if="opened || isCompactMode">
      <div class="program-area" :class="{ isCreate: !hasProgram }">
        <template v-if="hasProgram">
          <program-info class="program-area-item" />
          <program-statistics class="program-area-item" />
          <area-switcher class="switch-area" :contents="contents">
            <template v-slot:commentViewer><comment-viewer /></template>
            <template v-slot:description><program-description /></template>
          </area-switcher>
          <tool-bar class="program-area-item" />
          <div class="footer performance-metrics" v-if="isCompactMode">
            <div class="flex flex--center flex--grow flex--justify-start">
              <performance-metrics />
            </div>
          </div>
        </template>
        <template v-else>
          <p class="message">
            <i class="icon-namaco"></i>
            このエリアではニコニコ生放送を<br />配信するための機能が利用できます
          </p>
          <div class="button-wrapper">
            <button
              class="button button--primary button--create-program"
              @click="createProgram"
              :disabled="isCreating"
              v-if="!isCompactMode"
            >
              新しく番組を作成する
            </button>
            <div class="devider" v-if="!isCompactMode">
              <span class="devider-label">または</span>
            </div>
            <button
              class="button button--fetch-program"
              @click="fetchProgram"
              :disabled="isFetching"
              :class="[isCompactMode ? 'button--primary' : 'button--secondary']"
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
}

.nicolive-area-toggle-button {
  .dividing-border(left);
  .dividing-border(right);

  width: 24px;
  background-color: var(--color-bg-primary);

  > i {
    display: block;
    font-size: @font-size2;
    color: var(--color-text);
    transform: rotate(-90deg);
  }

  &:hover {
    > i {
      color: var(--color-text-light);
    }
  }

  &.nicolive-area--opened {
    > i {
      transform: rotate(90deg);
    }
  }
}

.nicolive-area-container {
  width: @nicolive-area-width;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  align-items: center;
  background-color: var(--color-bg-quinary);
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
  }
}

.message {
  display: flex;
  flex-direction: column;
  align-items: center;

  font-size: @font-size4;
  color: var(--color-text);
  line-height: 24px;
  text-align: center;
  margin-bottom: 24px;

  i {
    color: var(--color-text-dark);
    font-size: 88px;
    margin-bottom: 16px;
  }
}

.program-area-item {
  flex-shrink: 0;
}

.button-wrapper {
  display: flex;
  flex-direction: column;
  min-width: 200px;
  padding-bottom: 80px;

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

.devider {
  display: flex;
  align-items: center;
  margin: 16px 0;

  .devider-label {
    font-size: @font-size2;
    padding: 0 8px;
    color: var(--color-text-dark);
  }

  &:before,
  &:after {
    content: '';
    height: 1px;
    flex-grow: 1;
    background-color: var(--color-text-dark);
  }
}

.footer {
  .dividing-border;
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  position: relative;
  padding: 0 16px;
  max-width: none;
  height: 32px;
  flex: 0 0 auto;
  background-color: var(--color-bg-secondary);
}
</style>
