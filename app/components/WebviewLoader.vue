<template>
  <div>
    <slot/>
    <transition name="loader">
      <loading v-if="!readyToShow" :loadingStrs="['Loading...']" />
    </transition>
  </div>
</template>

<script lang="ts" src="./WebviewLoader.vue.ts"></script>

<style lang="less" scoped>
.loader-enter-active,
.loader-leave-active {
  transition: opacity 0.5s ease-out;
}

.loader-enter,
.loader-leave-to {
  opacity: 0;
}

/deep/ .s-loader__bg {
  position: absolute;
  height: 100%;
}
</style>
