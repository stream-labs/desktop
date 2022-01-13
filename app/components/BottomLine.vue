<template>
  <div class="bottom-line" :class="{ 'is-onAir': isOnAir }"></div>
</template>

<script lang="ts" src="./BottomLine.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.bottom-line {
  .dividing-border;

  width: 100%;
  height: 6px;
  background-color: var(--color-bottom-line);
  overflow: hidden;

  &.is-onAir {
    position: relative;

    &:after {
      content: '';
        position: absolute;
        top: 0;
        left: 0;
        display: block;
        background: linear-gradient(270deg, var(--color-bottom-line) 0%, var(--color-bottom-line-active) 3%, var(--color-bottom-line) 100%);
        animation: bottom-line-flow-anime linear 60s infinite forwards;
        width: 100%;
        height: 6px;
    } 
  }
}

@keyframes bottom-line-flow-anime {
  0% {
    transform: translateX(-100%);
  }
  2% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
