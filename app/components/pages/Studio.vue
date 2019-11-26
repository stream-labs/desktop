<template>
<div class="studio-page">
  <studio-editor :style="{ height: `calc(100% - ${eventsHeight + controlsHeight}px)` }" />
  <resize-bar
    v-if="isLoggedIn"
    position="top"
    v-model="eventsHeight"
    @onresizestop="onResizeStopHandler()"
    @onresizestart="onResizeStartHandler()"
    :max="maxHeight - controlsHeight"
    :min="minEventsHeight"
    :reverse="true"
  />
  <div :style="{ height: `${eventsHeight + controlsHeight}px` }" class="bottom-half">
    <recent-events v-if="isLoggedIn" :style="{ height: `${eventsHeight}px` }" @popout="eventsHeight = minEventsHeight" />
    <resize-bar
      position="top"
      v-model="controlsHeight"
      @onresizestop="onResizeStopHandler()"
      @onresizestart="onResizeStartHandler()"
      :max="maxHeight"
      :min="minControlsHeight"
      :reverse="true"
    />
    <studio-controls :style="{ height: `${controlsHeight}px` }" />
  </div>
</div>
</template>

<script lang="ts" src="./Studio.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.studio-page {
  flex-direction: column;
  .padding-bottom(1);
}

.bottom-half {
  display: flex;
  flex-direction: column;
}
</style>
