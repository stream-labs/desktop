<template>
  <modal-layout :showControls="false" :content-styles="{ padding: 0 }" :customControls="true">
    <div slot="content" class="add-source">
      <!-- Standard sources -->
      <add-source-info
        v-if="inspectedSourceDefinition"
        :name="inspectedSourceDefinition.name"
        :description="inspectedSourceDefinition.description"
        :showSupport="
          !inspectedSourceDefinition.prefabId &&
            !!sourceData(inspectedSourceDefinition.type).supportList
        "
      >
        <img
          v-if="sourceData(inspectedSourceDefinition.type).demoFilename"
          slot="media"
          class="source__demo"
          :src="getSrc(inspectedSourceDefinition.type)"
        />
        <ul slot="support-list" class="source-support__list">
          <li
            v-for="support in sourceData(inspectedSourceDefinition.type).supportList"
            :key="support"
          >
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
        <video v-if="widgetData(type).demoVideo" class="source__demo" autoplay loop slot="media">
          <source :src="getSrc(type)" />
        </video>
        <img
          v-if="!widgetData(type).demoVideo"
          class="source__demo"
          slot="media"
          :src="getSrc(type)"
        />
        <ul slot="support-list" class="source-support__list">
          <li v-for="support in widgetData(type).supportList" :key="support">
            {{ support }}
          </li>
        </ul>
      </add-source-info>

      <add-source-info
        v-if="inspectedSource === 'streamlabel'"
        :name="$t('Stream Label')"
        :description="
          $t(
            'Include text into your stream, such as follower count, last donation, and many others.',
          )
        "
        key="streamlabel-source-info"
      >
        <img
          class="source__demo"
          slot="media"
          :src="require(`../../../media/source-demos/${demoMode}/source-stream-labels.png`)"
        />
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
        key="replay-source-info"
      >
        <img
          class="source__demo"
          slot="media"
          :src="require(`../../../media/source-demos/${demoMode}/media.png`)"
        />
      </add-source-info>

      <add-source-info
        v-if="inspectedSource === 'icon_library'"
        :name="$t('Custom Icon')"
        :description="$t('Displays an icon from one of many selections')"
        key="icon-library-info"
      >
        <img
          class="source__demo"
          slot="media"
          :src="require(`../../../media/source-demos/${demoMode}/image.png`)"
        />
      </add-source-info>

      <add-source-info
        v-for="appSource in availableAppSources"
        :key="`${appSource.appId}-${appSource.source.id}`"
        v-if="
          inspectedSource === 'app_source' &&
            inspectedAppId === appSource.appId &&
            inspectedAppSourceId === appSource.source.id
        "
        :name="appSource.source.name"
        :description="appSource.source.about.description"
      >
        <img
          class="source__demo"
          slot="media"
          :src="getAppAssetUrl(appSource.appId, appSource.source.about.bannerImage)"
        />
        <ul slot="support-list">
          <li v-for="(bullet, index) in appSource.source.about.bullets" :key="index">
            {{ bullet }}
          </li>
        </ul>
      </add-source-info>

      <div class="source-info" v-if="inspectedSource === null">
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
            <img
              slot="media"
              class="source__demo"
              :src="require(`../../../media/source-demos/${demoMode}/sources.png`)"
            />
          </div>
        </div>
      </div>
      
      <div class="sources" :class="{ 'sources--has-platform-apps': showAppSources }" style='display: block'>
        <div class="source-group">
          <h3>{{ $t('Standard') }}</h3>
          <scrollable className="source-list">
            <li
              v-for="source in availableSources"
              :key="source.id"
              class="source source--standard"
              :class="{ 'source--active': inspectedSource === source.id }"
              @click="inspectSource(source.id)"
              @dblclick="source.prefabId ? selectPrefab(source.prefabId) : selectSource(source.id)"
            >
              {{ $t(source.name) }}
            </li>

            <li
              v-if="designerMode"
              class="source source--standard"
              :class="{ 'source--active': inspectedSource === 'icon_library' }"
              @click="inspectSource('icon_library')"
              @dblclick="selectSource('image_source', { propertiesManager: 'iconLibrary' })"
            >
              {{ $t('Custom Icon') }}
            </li>
          </scrollable>
        </div>

        <div class="source-group" v-if="!loggedIn">
          <h3>{{ $t('You must be logged in for Widgets') }}</h3>
          <button @click="handleAuth()" class="source--login">
            <h3>{{ $t('Click here to log in') }}</h3>
            <img :src="getLoginSrc()" />
          </button>
        </div>

        <div class="source-group" v-if="false">
          <h3>{{ $t('Widgets') }}</h3>
          <scrollable className="source-list">
            <div
              v-for="type in iterableWidgetTypes"
              :key="type"
              v-show="!widgetData(type).platforms || widgetData(type).platforms.has(platform)"
              class="source source--widget"
              :class="{ 'source--active': inspectedSource === widgetTypes[type] }"
              @click="inspectSource(widgetTypes[type])"
              @dblclick="selectWidget(widgetTypes[type])"
            >
              <div>{{ widgetData(type).name }}</div>
              <span v-if="essentialWidgetTypes.has(widgetTypes[type])" class="label--essential">{{
                $t('Essential')
              }}</span>
            </div>

            <div
              v-if="hasStreamlabel"
              class="source source--widget"
              :class="{ 'source--active': inspectedSource === 'streamlabel' }"
              @click="inspectSource('streamlabel')"
              @dblclick="selectStreamlabel"
            >
              <div>{{ $t('Stream Label') }}</div>
            </div>
            <div
              class="source source--widget"
              :class="{ 'source--active': inspectedSource === 'replay' }"
              @click="inspectSource('replay')"
              @dblclick="selectSource('ffmpeg_source', { propertiesManager: 'replay' })"
            >
              <div>{{ $t('Instant Replay') }}</div>
            </div>
          </scrollable>
        </div>

        <div class="source-group" v-if="showAppSources">
          <h3>{{ $t('Apps') }}</h3>
          <scrollable className="source-list">
            <li
              v-for="appSource in availableAppSources"
              :key="`${appSource.appId}-${appSource.source.id}`"
              class="source source--standard"
              :class="{
                'source--active':
                  inspectedSource === 'app_source' &&
                  inspectedAppId === appSource.appId &&
                  inspectedAppSourceId === appSource.source.id,
              }"
              @click="inspectSource('app_source', appSource.appId, appSource.source.id)"
              @dblclick="selectAppSource(appSource.appId, appSource.source.id)"
            >
              {{ appSource.source.name }}
            </li>
          </scrollable>
        </div>
      </div>
    </div>

    <div slot="controls">
      <button
        @click="selectInspectedSource()"
        class="button button--action"
        :disabled="inspectedSource === null"
      >
        {{ $t('Add Source') }}
      </button>
    </div>
  </modal-layout>
</template>

<script lang="ts" src="./SourcesShowcase.vue.ts"></script>

<style lang="less">
@import '../../styles/index';

.source-info {
  .padding(2);

  background-color: var(--background);
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: row;
  flex: 0 0 225px;
  height: 225px;
  align-items: flex-start;
}
</style>

<style lang="less" scoped>
@import '../../styles/index';

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
  height: ~'calc(100vh - 365px)';
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
  .radius();

  cursor: pointer;
  padding: 4px 8px;
  background-color: var(--section);
  width: 48%;
  margin-right: 4px;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 100%;
  display: inline-block;
  overflow: hidden;

  &:hover,
  &.source--active {
    .weight(@medium);

    color: var(--title);
    background-color: var(--button);
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
  position: relative;
  display: inline-block;

  .label--essential {
    position: absolute;
    top: 6px;
  }
}

.source-info__media {
  .radius();
  .padding-left(2);

  overflow: hidden;
  text-align: center;
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

.source--login {
  .radius();
  border: none;

  cursor: pointer;
  padding: 4px 8px;
  background-color: var(--section);
  width: 100%;
  height: 90%;
  margin-right: 4px;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 100%;
  display: inline-block;
  overflow: hidden;

  &:hover {
    .weight(@medium);
    color: var(--title);
    background-color: var(--button);
  }

  > div {
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 100%;
    display: inline-block;
    overflow: hidden;
  }

  img {
    width: 50%;
    height: 50%;
  }
}
</style>
