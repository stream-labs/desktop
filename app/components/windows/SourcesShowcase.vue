<template>
<modal-layout
  :showControls="false"
  :content-styles="{ padding: 0 }"
  :customControls="true"
>
  <div slot="content"
    class="add-source">
    <!-- Standard sources -->
    <add-source-info
      v-if="inspectedSourceDefinition"
      :name="inspectedSourceDefinition.name"
      :description="inspectedSourceDefinition.description"
      :showSupport="!inspectedSourceDefinition.prefabId && !!sourceData(inspectedSourceDefinition.type).supportList"
    >
      <img v-if="sourceData(inspectedSourceDefinition.type).demoFilename" slot="media" class="source__demo source__demo--day" :src="getSrc(inspectedSourceDefinition.type, 'day')" />
      <img v-if="sourceData(inspectedSourceDefinition.type).demoFilename" slot="media" class="source__demo source__demo--night" :src="getSrc(inspectedSourceDefinition.type, 'night')"/>
      <ul slot="support-list" class="source-support__list">
        <li v-for="support in sourceData(inspectedSourceDefinition.type).supportList" :key="support">
          {{ support }}
        </li>
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
      v-if="inspectedSource === 'streamlabel'"
      :name="$t('Stream Label')"
      :description="$t('Include text into your stream, such as follower count, last donation, and many others.')"
      key="streamlabel-source-info">
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

    <add-source-info
      v-if="inspectedSource === 'replay'"
      :name="$t('Instant Replay')"
      :description="$t('Automatically plays your most recently captured replay in your stream.')"
      key="replay-source-info">
      <img class="source__demo source__demo--day" slot="media" src="../../../media/source-demos/day/media.png"/>
      <img class="source__demo source__demo--night" slot="media" src="../../../media/source-demos/night/media.png"/>
    </add-source-info>

    <add-source-info
      v-for="appSource in availableAppSources"
      :key="`${appSource.appId}-${appSource.source.id}`"
      v-if="(inspectedSource === 'app_source') && (inspectedAppId === appSource.appId) && (inspectedAppSourceId === appSource.source.id)"
      :name="appSource.source.name"
      :description="appSource.source.about.description">
      <img class="source__demo source__demo--night" slot="media" :src="getAppAssetUrl(appSource.appId, appSource.source.about.bannerImage)" />
      <ul slot="support-list">
        <li v-for="(bullet, index) in appSource.source.about.bullets" :key="index">
          {{ bullet }}
        </li>
      </ul>
    </add-source-info>

    <div
      class="source-info"
      v-if="inspectedSource === null">
      <div class="source-welcome">
        <div class="source-info__text">
          <h2>{{ $t('Welcome to sources!') }}</h2>
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

    <div class="sources" :class="{'sources--has-platform-apps' : showAppSources}">
      <div class="source-group">
        <h3>{{ $t('Standard') }}</h3>
        <ul class="source-list">
          <li
            v-for="source in availableSources"
            :key="source.id"
            class="source source--standard"
            :class="{'source--active': inspectedSource === source.id}"
            @click="inspectSource(source.id)"
            @dblclick="source.prefabId ? selectPrefab(source.prefabId) : selectSource(source.id)">
            {{ $t(source.name) }}
          </li>
        </ul>
      </div>

      <div class="source-group" v-if="loggedIn">
        <h3>{{ $t('Widgets') }}</h3>
        <div class="source-list">
          <div
            v-for="type in iterableWidgetTypes"
            :key="type"
            v-show="!widgetData(type).platforms || widgetData(type).platforms.has(platform)"
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
          <div
            class="source source--widget"
            :class="{ 'source--active': inspectedSource === 'replay' }"
            @click="inspectSource('replay')"
            @dblclick="selectSource('ffmpeg_source', { propertiesManager: 'replay' })">
            <div>{{ $t('Instant Replay') }}</div>
          </div>
        </div>
      </div>

      <div class="source-group" v-if="showAppSources">
        <h3>{{ $t('Apps') }}</h3>
        <ul class="source-list">
          <li
            v-for="appSource in availableAppSources"
            :key="`${appSource.appId}-${appSource.source.id}`"
            class="source source--standard"
            :class="{
              'source--active': inspectedSource === 'app_source' &&
                inspectedAppId === appSource.appId &&
                inspectedAppSourceId === appSource.source.id
            }"
            @click="inspectSource('app_source', appSource.appId, appSource.source.id)"
            @dblclick="selectAppSource(appSource.appId, appSource.source.id)">
            {{ appSource.source.name }}
          </li>
        </ul>
      </div>
    </div>
  </div>

    <div slot="controls">
      <button
        @click="selectInspectedSource()"
        class="button button--action"
        :disabled="inspectedSource === null">
        {{ $t('Add Source') }}
      </button>
    </div>
</modal-layout>
</template>

<script lang="ts" src="./SourcesShowcase.vue.ts"></script>

<style lang="less">
@import "../../styles/index";

.source-info {
  .padding(2);
  border-bottom: 1px solid @day-border;
  display: flex;
  flex-direction: row;
  flex: 0 0 225px;
  height: 225px;
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

h2 {
  .margin-bottom(2);
}

.add-source {
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;
}

.source-welcome {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.sources {
  .padding(2);
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 16px;
}

.sources--has-platform-apps {
  grid-template-columns: 1fr 1fr 1fr;
}

.source-list {
  list-style-type: none;
  margin: 0;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  height: ~"calc(100vh - 365px)";
  overflow-y: auto;
  align-content: flex-start;

  .source {
    height: 30px;

    &:nth-child(1),
    &:nth-child(2) {
      margin-top: 0;
    }
  }
}

.source {
  cursor: pointer;
  .transition();
  padding: 4px 8px;
  margin-top: 8px;
  background-color: @day-section;
  width: 49%;
  .radius();
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 100%;
  display: inline-block;
  overflow: hidden;

  &:hover,
  &.source--active {
    color: @day-title;
    .weight(@medium);
    background-color: @light-3;
  }

  > div {
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
}

.source-info__media {
  .radius;
  overflow: hidden;
  text-align: center;
  .padding-left(2);
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
    .radius();
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
  .source {
    background: @night-hover;
    border-color: @night-hover;

    &:hover,
    &.source--active {
      color: @night-title;
      background: @night-secondary;
    }
  }

  .source__demo--day {
    display: none;
  }

  .source__demo--night {
    display: block;
  }
}

</style>
