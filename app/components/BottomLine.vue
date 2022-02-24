<template>
  <div
    class="bottom-line"
    :class="{ 'is-streaming': isStreaming, 'is-compactMode': isCompactMode }"
  ></div>
</template>

<script lang="ts" src="./BottomLine.vue.ts"></script>

<style lang="less" scoped>
@import '../styles/index';

.bottom-line {
  .dividing-border;

  width: 100%;
  height: 6px;
  background-color: var(--color-bottom-line);
  overflow: hidden;

  &.is-streaming {
    position: relative;

    &:after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      display: block;
      background: linear-gradient(
        270deg,
        var(--color-bottom-line) 0%,
        var(--color-bottom-line-active) 3%,
        var(--color-bottom-line) 60%
      );
      animation-name: bottom-line-flow-anime;
      animation-duration: 6s;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
      animation-fill-mode: both;
      animation-delay: 2s;
      width: 100%;
      height: 6px;
    }

    &.is-compactMode {
      &:after {
        animation-duration: 5s;
      }
    }
  }
}

@keyframes bottom-line-flow-anime {
  0% {
    transform: translateX(-100%);
  }
  60% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
