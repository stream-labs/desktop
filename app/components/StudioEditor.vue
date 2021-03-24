<template>
  <div class="main-container" ref="studioModeContainer">
    <div v-if="displayEnabled" class="studio-mode-container" :class="{ stacked }">
      <studio-mode-controls v-if="studioMode" :stacked="stacked" />
      <div class="studio-display-container" :class="{ stacked }">
        <div
          class="studio-editor-display-container noselect"
          ref="display"
          :style="{ cursor: cursor }"
          @mousedown="handleMouseDown"
          @mouseup="handleMouseUp"
          @mousemove="handleMouseMove"
          @mouseenter="handleMouseEnter"
          @dblclick="handleMouseDblClick"
        >
          <display
            class="studio-editor-display"
            :componentProps="{
              drawUI: true,
              paddingSize: 10,
              sourceId: studioMode ? getStudioTransitionName() : void 0,
              renderingMode: renderingMode,
              onOutputResize: e => onOutputResize(e),
            }"
          />
        </div>
        <div v-if="studioMode" class="studio-mode-display-container">
          <display class="studio-mode-display" :paddingSize="10" />
        </div>
      </div>
    </div>
    <div v-else class="no-preview">
      <div class="message" v-if="performanceMode">
        {{ $t('Preview is disabled in performance mode') }}
        <div class="button button--action" @click="enablePreview">
          {{ $t('Disable Performance Mode') }}
        </div>
      </div>
      <div ref="placeholder" class="placeholder" v-else>
        <div v-if="studioMode" class="placeholder-controls" :class="{ stacked }" />
        <img
          src="../../media/images/16x9.png"
          :class="{ vertical: verticalPlaceholder, studioMode, stacked }"
          @dragstart.prevent
        />
        <img
          v-if="studioMode"
          src="../../media/images/16x9.png"
          :class="{ vertical: verticalPlaceholder, studioMode, stacked, right: true }"
          @dragstart.prevent
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./StudioEditor.vue.ts"></script>

<style lang="less" scoped>
@import '../styles/index';

.main-container {
  height: 100%;
}

.studio-editor-display-container {
  position: relative;
  flex-grow: 1;
  background-color: var(--section);
}

.studio-editor-display {
  position: absolute;
  width: 100%;
  height: 100%;
}

.studio-mode-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  height: 100%;

  &.stacked {
    flex-direction: row;
  }
}

.studio-display-container {
  flex-grow: 1;
  display: flex;
  height: 100%;
  position: relative;

  &.stacked {
    flex-direction: column;
  }
}

.studio-mode-display-container {
  flex-grow: 1;
  position: relative;
}

.studio-mode-display {
  position: absolute;
  width: 100%;
}

.placeholder {
  background: var(--section);
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;

  img {
    position: absolute;
    top: 5px;
    height: calc(100% - 10px);
    width: auto;
    left: 50%;
    transform: translate(-50%, 0);
  }

  img.vertical {
    width: calc(100% - 10px);
    height: auto;
    top: 50%;
    left: 5px;
    transform: translate(0, -50%);
  }

  img.studioMode {
    height: auto;
    top: 50%;
    width: calc(50% - 20px);
    left: 10px;
    transform: translate(0, calc(-50% + 30px));
  }

  img.studioMode.right {
    left: auto;
    right: 10px;
  }

  img.studioMode.stacked {
    height: calc(50% - 10px);
    width: auto;
    top: 5px;
    left: 50%;
    transform: translate(calc(-50% + 60px), 0);
  }

  img.studioMode.stacked.right {
    bottom: 5px;
    top: auto;
  }
}

.placeholder-controls {
  height: 60px;
  color: var(--paragraph);
  background-color: var(--background);

  &.stacked {
    position: absolute;
    height: 100%;
    width: 125px;
    left: 0;
    top: 0;
  }
}

.no-preview {
  width: 100%;
  height: 100%;
  position: relative;
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;

  .message {
    max-width: 50%;
    position: relative;

    .button {
      margin-top: 20px;
      display: block;

      &:hover {
        cursor: pointer;
      }
    }
  }
}
</style>
