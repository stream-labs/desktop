<template>
<modal-layout
  bare-content
  :show-controls="false"
  :title="$t('sources.addSourceTitle')">

  <div slot="content"
    class="add-source"
    data-test="SourcesShowCase">
    <add-source-info
      v-if="inspectedSource === 'image_source'"
      @clickAdd="selectSource('image_source')"
      sourceType="image_source"
      key="1">
  <imageSourceIcon slot="media" />
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'slideshow'"
      @clickAdd="selectSource('slideshow')"
      sourceType="slideshow"
      key="2">
      <SlideshowIcon slot="media" />
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'ffmpeg_source'"
      @clickAdd="selectSource('ffmpeg_source')"
      sourceType="ffmpeg_source"
      key="3">
      <FfmpegSourceIcon slot="media" />
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'window_capture'"
      @clickAdd="selectSource('window_capture')"
      sourceType="window_capture"
      key="4">
      <WindowCaptureIcon slot="media" />
      <p slot="attention-text" class="attention">
         {{$t('sources.windowCaptureMessage') }}
      </p>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'dshow_input'"
      @clickAdd="selectSource('dshow_input')"
      sourceType="dshow_input"
      key="5">
      <MonitorCaptureIcon slot="media" />
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'wasapi_output_capture'"
      @clickAdd="selectSource('wasapi_output_capture')"
      sourceType="wasapi_output_capture"
      key="6">
      <WasapiOutputIcon slot="media" />
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'color_source'"
      @clickAdd="selectSource('color_source')"
      sourceType="color_source"
      key="7">
      <ColorSourceIcon slot="media" />
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'browser_source'"
      @clickAdd="selectSource('browser_source')"
      sourceType="browser_source"
      key="8">
      <BrowserSourceIcon slot="media" />
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'text_gdiplus'"
      @clickAdd="selectSource('text_gdiplus')"
      sourceType="text_gdiplus"
      key="9">
      <TextGdiplusIcon slot="media" />
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'monitor_capture'"
      @clickAdd="selectSource('monitor_capture')"
      sourceType="monitor_capture"
      key="10">
      <DshowInputIcon slot="media" />
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'game_capture'"
      @clickAdd="selectSource('game_capture')"
      sourceType="game_capture"
      key="11">
      <GameCaptureIcon slot="media" />
      <p slot="attention-text" class="attention">
         {{$t('sources.gameCaptureMessage') }}
      </p>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'wasapi_input_capture'"
      @clickAdd="selectSource('wasapi_input_capture')"
      sourceType="wasapi_input_capture"
      key="12">
     <WasapiInputCaptureIcon slot="media" />
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'ndi_source'"
      @clickAdd="selectSource('ndi_source')"
      sourceType="ndi_source"
      key="13">
     <NdiSourceIcon slot="media" />
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'decklink-input'"
      @clickAdd="selectSource('decklink-input')"
      sourceType="decklink-input"
      key="14">
     <BlackmagicSourceIcon slot="media" />
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'scene'"
      @clickAdd="selectSource('scene')"
      sourceType="scene"
      key="15">
      <AddSceneIcon slot="media" />
    </add-source-info>

    <div
      class="source-info"
      v-if="inspectedSource === null">
      <AddFileIcon slot="media" />
        <div class="source-info__text">
          <h3>{{ $t('sources.sourcesWelcomeMessage') }}</h3>
          <ol>
            <li>{{ $t('sources.addSourceProcess1') }}</li>
            <li>{{ $t('sources.addSourceProcess2') }}</li>
            <li>{{ $t('sources.addSourceProcess3') }}</li>
          </ol>
        </div>
    </div>

    <div class="sources">
      <div class="source-group">
        <ul class="source-list">
          <li
            v-for="source in availableSources"
            class="source source--standard"
            :class="{'source--active': inspectedSource === source.value}"
            :data-test="`${source.value}`"
            :key="source.value"
            @click="inspectSource(source.value)"
            @dblclick="selectSource(source.value)">
            {{ $t(`source-props.${source.value}.name`) }}
          </li>
        </ul>
      </div>
    </div>

    <div class="modal-layout-controls">
      <button
        @click="selectInspectedSource()"
        class="button button--action"
        :disabled="inspectedSource === null"
        data-test="AddSource">
        {{ $t('sources.addSourceButton') }}
      </button>
    </div>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./SourcesShowcase.vue.ts"></script>

<style lang="less">
@import "../../styles/index";

.source-info {
  padding: 0 20px;
  background-color: @bg-primary;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  flex: 0 0 192px;
  height: 192px;
  align-items: center;
}

.source-image {
  flex: 1;
  height: 82px;
}

.source-info__text,
.source-support__list {
  flex: 2;
  > h3 {
    font-size: 16px;
  }
}

</style>

<style lang="less" scoped>
@import "../../styles/index";
.modal-layout-controls {
  border-top: 1px solid @bg-secondary;
}
.add-source {
  color: @text-primary;
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;
}

.sources {
  padding: 16px;
  display: flex;
  flex: 1 0 auto;
}

.source-group {
  margin: 0;
  padding: 4px;
  flex: 0 0 100%;
}

.source-list {
  list-style-type: none;
  margin: 0;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;

}

.source {
  color: @text-secondary;
  cursor: pointer;
  .transition;
  text-align: center;
  padding: 8px;
  margin-bottom: 16px;
  min-width: 198px;
  border-radius: 3px;
  border: 1px solid @text-secondary;

  &:hover,
  &.source--active {
    color: @hover;
    background: @text-primary;
  }

  >div {
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 100%;
    display: inline-block;
    overflow: hidden;
  }
}

.source--standard {
  display: inline-block;
}

.source-info__media {
  overflow: hidden;
  text-align: center;
  padding-left: 20px;
  align-items: center;
  align-content: center;
  max-height: 180px;
  justify-content: center;
  display: flex;
  flex: 0 0 50%;

}

.attention {
  font-size: 12px;
  color: @text-secondary;
  padding-right: 20px;
}

</style>
