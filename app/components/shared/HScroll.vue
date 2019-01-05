<template>
  <div class="h-scroll-wrapper" @wheel="onWheelHandler">
    <div ref="track" class="h-scroll-track"><slot></slot></div>
  </div>
</template>


<script lang="ts" src="./HScroll.vue.ts"></script>

<style lang="less" scoped>
  @import "../../styles/index";

  .h-scroll-wrapper {
    overflow-y: auto;
    overflow-x: hidden;
  }



</style>
