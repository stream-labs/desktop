<template>
<div class="footer">
  <div class="flex flex--center">
    <performance-metrics />
    <notifications-area class="notifications-area"/>
  </div>

  <div class="nav-right">
    <div class="nav-item">
      <test-widgets v-if="loggedIn" />
    </div>
    <div class="nav-item">
      <button
        :disabled="locked"
        class="record-button"
        @click="toggleRecording"
        :class="{ active: streamingService.isRecording }">
        <span>REC</span>
      </button>
    </div>
    <div class="nav-item">
      <start-streaming-button :disabled="locked" />
    </div>
  </div>
</div>
</template>

<script lang="ts" src="./StudioFooter.vue.ts"></script>

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
  flex: 0 0 auto;
}

.nav-right {
  display: flex;
  align-items: center;
}

.nav-item {
  margin-left: 20px;

  @media(max-width: 1200px) {
    font-size: 12px;
    margin-left: 12px;
  }
}

.record-button {
  position: relative;
  width: 30px;
  height: 30px;
  background-color: #dcdfe2;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 100%;
  opacity: .6;
  .transition;
  .bold;
  border: 1px solid #c4c5c5;
  box-sizing: content-box;
  letter-spacing: .2px;

  span {
    font-size: 10px;
    color: @red;
  }

  &:hover {
    opacity: 1;
  }

  &.active {
    opacity: 1;
    animation: pulse 2.5s infinite;
    border: 1px solid @red;
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(252, 62, 63, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(0, 0, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
  }
}

.night-theme {
  .footer {
    background-color: @night-primary;
    border-color: @night-border;
  }

  .record-button {
    background-color: #3c4c53;
    border-color: @night-border;

    &.active {
      border-color: @red;
    }
  }
}
</style>
