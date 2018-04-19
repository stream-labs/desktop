<template>
<div class="projector-container">
  <div
    class="projector-fullscreen"
    @keydown="exitFullscreen"
    v-if="fullscreen">
    <source-preview v-if="sourceId" :source-id="sourceId" />
    <display v-else :drawUI="false" />
  </div>
  <modal-layout
    v-else
    :title="title"
    :content-styles="{ padding: 0 }"
    :showControls="false">
    <div slot="content" class="projector-windowed">
      <button
        v-for="(display, index) in allDisplays"
        :key="display.id"
        @click="enterFullscreen(display)">
        Fullscreen Display {{ index }}: {{ display.size.width }}x{{ display.size.height }}
      </button>
      <source-preview v-if="sourceId" :source-id="sourceId" />
      <display v-else :drawUI="false" />
    </div>
  </modal-layout>
</div>
</template>

<script lang="ts" src="./Projector.vue.ts"></script>

<style lang="less" scoped>
.projector-container {
  height: 100%;
}

.projector-fullscreen {
  height: 100%;
}

.projector-windowed {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.projector-display {
  flex-grow: 1;
}
</style>
