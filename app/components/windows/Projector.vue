<template>
  <div class="projector-container">
    <div class="projector-fullscreen" @keydown="exitFullscreen" v-if="fullscreen">
      <display
        :componentProps="{ sourceId: sourceId, renderingMode: renderingMode }"
        style="flex-grow: 1"
      />
    </div>
    <modal-layout v-else :content-styles="{ padding: 0 }" :showControls="false">
      <div slot="content" class="projector-windowed">
        <scrollable className="button-container" :autoSizeCapable="true">
          <div class="projector-buttons">
            <button
              class="button button--trans"
              v-for="(display, index) in allDisplays"
              :key="display.id"
              @click="enterFullscreen(display)"
            >
              Fullscreen Display {{ index + 1 }}: {{ display.size.width }}x{{ display.size.height }}
            </button>
          </div>
        </scrollable>
        <display
          v-if="!hideStyleBlockers"
          :componentProps="{ sourceId: sourceId, renderingMode: renderingMode }"
        />
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
  display: flex;
}

.projector-windowed {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.projector-display {
  flex-grow: 1;
}

.projector-buttons {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
