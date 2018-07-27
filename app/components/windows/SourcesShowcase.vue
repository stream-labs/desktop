<template>
<modal-layout
  :show-controls="false"
  :content-styles="{ padding: 0 }"
  :title="$t('Add Source')">

  <div slot="content"
    class="add-source">
    <!-- Standard sources -->
    <add-source-info
      v-if="inspectedSource === 'image_source'"
      @clickAdd="selectSource('image_source')"
      :name="$t('Image')"
      :description="$t('Add images to your scene.')"
      key="1">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/image.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/image.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>png</li>
        <li>jpg</li>
        <li>jpeg</li>
        <li>gif</li>
        <li>tga</li>
        <li>bmp</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'slideshow'"
      @clickAdd="selectSource('slideshow')"
      :name="$t('Image Slide Show')"
      :description="$t('Add a slideshow of images to your scene.')"
      key="2">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/image-slide-show.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/image-slide-show.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>png</li>
        <li>jpg</li>
        <li>jpeg</li>
        <li>gif</li>
        <li>tga</li>
        <li>bmp</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'ffmpeg_source'"
      @clickAdd="selectSource('ffmpeg_source')"
      :name="$t('Media Source')"
      :description="$t('Add videos or sound clips to your scene.')"
      key="3">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/media.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/media.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>mp4</li>
        <li>ts</li>
        <li>mov</li>
        <li>flv</li>
        <li>mkv</li>
        <li>avi</li>
        <li>mp3</li>
        <li>ogg</li>
        <li>aac</li>
        <li>wav</li>
        <li>gif</li>
        <li>webm</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'window_capture'"
      @clickAdd="selectSource('window_capture')"
      :name="$t('Window Capture')"
      :description="$t('Capture a specific window that\'s open on your computer.')"
      key="4">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/window-capture.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/window-capture.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>{{ $t('Compatible with most modern browsers and programs') }}</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'dshow_input'"
      @clickAdd="selectSource('dshow_input')"
      :name="$t('Video Capture Device')"
      :description="$t('Select from your build in USB webcam or an external.')"
      key="5">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/video-capture.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/video-capture.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>{{ $t('Built in webcam') }}</li>
        <li>{{ $t('Logitech webcam') }}</li>
        <li>{{ $t('Capture cards (Elgato, Avermedia, BlackMagic)') }}</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'wasapi_output_capture'"
      @clickAdd="selectSource('wasapi_output_capture')"
      :name="$t('Audio Output Capture')"
      :description="$t('Captures your desktop audio for the purpose of playing sound, such as music or speech.')"
      key="6">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/audio-output.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/audio-output.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>{{ $t('Desktop audio') }}</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'color_source'"
      @clickAdd="selectSource('color_source')"
      :name="$t('Color Source')"
      :description="$t('Add a color to the background of your whole scene or just a part.')"
      key="7">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/color-source.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/color-source.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>Hex</li>
        <li>RGBA</li>
        <li>HSV</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'browser_source'"
      @clickAdd="selectSource('browser_source')"
      :name="$t('BrowserSource')"
      :description="$t('Allows you to add web-based content as a source, such as web pages and Flash SWFs.')"
      key="8">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/browser-source.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/browser-source.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>{{ $t('Websites') }}</li>
        <li>{{ $t('Third party widget') }}s</li>
        <li>HTML</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'text_gdiplus'"
      @clickAdd="selectSource('text_gdiplus')"
      :name="$t('Text (GDI+)')"
      :description="$t('Add text to your scene and adjust its style.')"
      key="9">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/text.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/text.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>Hex</li>
        <li>RGBA</li>
        <li>HSV</li>
        <li>{{ $t('System Fonts') }}</li>
        <li>{{ $t('System Sizes') }}</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'monitor_capture'"
      @clickAdd="selectSource('monitor_capture')"
      :name="$t('Display Capture')"
      :description="$t('Capture your entire computer monitor.')"
      key="10">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/display-capture.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/display-capture.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>{{ $t('Primary monitor') }}</li>
        <li>{{ $t('Secondary monitor') }}</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'game_capture'"
      @clickAdd="selectSource('game_capture')"
      :name="$t('Game Capture')"
      :description="$t('Capture a game you\'re playing on your computer.')"
      key="11">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/game-capture.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/game-capture.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>{{ $t('Built in works with most modern computer games') }}</li>
      </ul>
    </add-source-info>

    <add-source-info
      class='ndi-source'
      v-if="inspectedSource === 'ndi_source'"
      @clickAdd="selectSource('ndi_source')"
      showSupport="false"
      :name="$t('NDI source')"
      :description="$t('Allow you to capture NDI output streams.')">
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'wasapi_input_capture'"
      @clickAdd="selectSource('wasapi_input_capture')"
      :name="$t('Audio Input Capture')"
      :description="$t('Any device that attaches to a computer for the purpose of capturing sound, such as music or speech.')"
      key="12">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/audio-input.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/audio-input.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>{{ $t('Built in microphones') }}</li>
        <li>{{ $t('USB microphones') }}</li>
        <li>{{ $t('Other USB devices') }}</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'decklink-input'"
      @clickAdd="selectSource('decklink-input')"
      :name="$t('Blackmagic Device')"
      :description="$t('Capture the feed your decklink device is capturing.')"
      key="13">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/sources.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/sources.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>{{ $t('Works with most of the recent Blackmagic cards.') }}</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'openvr_capture'"
      @clickAdd="selectSource('openvr_capture')"
      name="OpenVR Capture"
      description="Directly capture the OpenVR monitoring video buffer of your HMD."
      key="29">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/vr-capture.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/vr-capture.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>OpenVR</li>
        <li>SteamVR</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'liv_capture'"
      @clickAdd="selectSource('liv_capture')"
      name="LIV Client Capture"
      description="Directly capture the LIV compositor output, reducing load and simplifying setup for Mixed Reality."
      key="29">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/vr-capture.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/vr-capture.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>LIV</li>
      </ul>
    </add-source-info>

    <!-- Widget Sources -->
    <add-source-info
      v-for="type in iterableWidgetTypes"
      :key="type"
      v-if="inspectedSource === widgetTypes[type]"
      :name="widgetData(type).name"
      :description="widgetData(type).description"
    >
      <video v-if="widgetData(type).demoVideo" class="source__demo source__demo--day" autoplay loop slot="media">
        <source :src="getSrc(type, 'day')">
      </video>
      <video v-if="widgetData(type).demoVideo" class="source__demo source__demo--night" autoplay loop slot="media">
        <source :src="getSrc(type, 'night')">
      </video>
      <img v-if="!widgetData(type).demoVideo" class="source__demo source__demo--day" slot="media" :src="getSrc(type, 'day')"/>
      <img v-if="!widgetData(type).demoVideo" class="source__demo source__demo--night" slot="media" :src="getSrc(type, 'night')"/>
      <ul slot="support-list" class="source-support__list">
        <li v-for="support in widgetData(type).supportList" :key="support">
          {{ support }}
        </li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'scene'"
      :name="$t('Scene')"
      :description="$t('Allows you to add existing scene as a source')"
      key="27">
      <img class="source__demo source__demo--day" slot="media" src="../../../media/source-demos/day/scene.png"/>
      <img class="source__demo source__demo--night" slot="media" src="../../../media/source-demos/night/scene.png"/>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'streamlabel'"
      :name="$t('Stream Label')"
      :description="$t('Include text into your stream, such as follower count, last donation, and many others.')"
      key="28">
      <img class="source__demo source__demo--day" slot="media" src="../../../media/source-demos/day/source-stream-labels.png"/>
      <img class="source__demo source__demo--night" slot="media" src="../../../media/source-demos/night/source-stream-labels.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>{{ $t('New Followers') }}</li>
        <li>{{ $t('New Subscribers') }}</li>
        <li>{{ $t('New Cheers') }}</li>
        <li>{{ $t('New Donations') }}</li>
        <li>{{ $t('All-Time Top Donator') }}</li>
        <li>{{ $t('Weekly Top Donator') }}</li>
        <li>{{ $t('Monthly Follows') }}</li>
        <li>{{ $t('Many more') }}</li>
      </ul>
    </add-source-info>

    <div
      class="source-info"
      v-if="inspectedSource === null">
      <div class="source-welcome">
        <div class="source-info__text">
          <h3>{{ $t('Welcome to sources!') }}</h3>
          <ol>
            <li>{{ $t('Browse through our Standard and Widget sources') }}</li>
            <li>{{ $t('Click a source to get more details about it') }}</li>
            <li>{{ $t('Click "Add Source" when you\'re ready to add it to your scene') }}</li>
          </ol>
        </div>
        <div class="source-info__media">
          <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/sources.png"/>
          <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/sources.png"/>
        </div>
      </div>
    </div>

    <div class="sources">
      <div class="source-group">
        <h4>{{ $t('Standard') }}</h4>
        <ul class="source-list">
          <li
            v-for="source in availableSources"
            :key="source.value"
            class="source source--standard"
            :class="{'source--active': inspectedSource === source.value}"
            @click="inspectSource(source.value)"
            @dblclick="selectSource(source.value)">
            {{ $t(source.description) }}
          </li>
        </ul>
      </div>

      <div class="source-group" v-if="loggedIn">
        <h4>{{ $t('Widgets') }}</h4>
        <div class="source-list">
          <div
            v-for="type in iterableWidgetTypes"
            :key="type"
            v-show="!widgetData(type).platform || widgetData(type).platform === platform"
            class="source source--widget"
            :class="{'source--active': inspectedSource === widgetTypes[type]}"
            @click="inspectSource(widgetTypes[type])"
            @dblclick="selectWidget(widgetTypes[type])"
          >
            <div>{{ widgetData(type).name }}</div>
            <span v-if="essentialWidgetTypes.has(widgetTypes[type])" class="label--essential">{{ $t('Essential') }}</span>
          </div>

          <div
            class="source source--widget"
            :class="{'source--active': inspectedSource === 'streamlabel'}"
            @click="inspectSource('streamlabel')"
            @dblclick="selectSource('text_gdiplus', { propertiesManager: 'streamlabels' })">
            <div>{{ $t('Stream Label') }}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-layout-controls">
      <button
        @click="selectInspectedSource()"
        class="button button--action"
        :disabled="inspectedSource === null">
        {{ $t('Add Source') }}
      </button>
    </div>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./SourcesShowcase.vue.ts"></script>

<style lang="less">
@import "../../styles/index";

.source-info {
  padding: 20px;
  border-bottom: 1px solid @day-border;
  display: flex;
  flex-direction: row;
  flex: 0 0 210px;
  height: 210px;
  align-items: flex-start;
}

.night-theme {
  .source-info {
    border-color: @night-border;
    background-color: @night-primary;
  }
}
</style>

<style lang="less" scoped>
@import "../../styles/index";

h4 {
  color: @grey;
}

.add-source {
  color: @navy;
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;
}

.source-welcome {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.sources {
  padding: 20px;
  display: flex;
  flex: 1 0 auto;

  .source-group {
    &:last-child {
      padding: 20px 0 20px 20px;
      border-right: none;
    }
  }
}

.source-group {
  border-right: 1px solid @day-border;
  margin: -20px 0px -20px 0px;
  padding: 20px 20px 20px 0;
  flex: 0 0 50%;
}

.source-list {
  list-style-type: none;
  margin: 0;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;

  .source {
    &:nth-child(1),
    &:nth-child(2) {
      margin-top: 0;
    }
  }
}

.source {
  color: @navy;
  cursor: pointer;
  .transition;
  border: 1px solid @day-border;
  padding: 4px 10px;
  margin-top: 10px;
  width: 49%;

  &:hover,
  &.source--active {
    color: @navy-secondary;
    .semibold;
    border-color: @day-border;
    background-color: @day-secondary;
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

.source--widget {
  display: flex;
  align-items: center;
  .radius;
  .transition;
}

.source-info__media {
  .radius;
  overflow: hidden;
  text-align: center;
  padding-left: 20px;
  align-items: center;
  align-content: center;
  max-height: 150px;
  justify-content: center;
  display: flex;
  flex: 0 0 50%;

  video,
  img {
    width: auto;
    max-height: 150px;
    max-width: 100%;
    .radius;
  }
}

.source__icon {
  margin-right: 10px;
  width: 30px;
}

.source__demo--day {
  display: block;
}

.source__demo--night {
  display: none;
}

.night-theme {
  .add-source {
    color: @grey;
  }

  .source {
    color: @grey;
    background: @night-hover;
    border-color: @night-hover;

    &:hover,
    &.source--active {
      color: @white;
      border-color: @night-secondary;
      background: @night-secondary;
    }
  }

  .source-group {
    border-color: @night-border;
  }

  .source__demo--day {
    display: none;
  }

  .source__demo--night {
    display: block;
  }

}

</style>
