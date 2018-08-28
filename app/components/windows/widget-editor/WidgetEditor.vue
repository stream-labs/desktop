<template>
<modal-layout
  :title="windowTitle"
  v-if="previewSource"
>
  <div class="container" slot="content">
    <div class="top-settings"><button class="button button--action test-button">{{ $t('Test Widget') }}</button></div>
    <tabs
      :showContent="false"
      className="widget-editor__top-tabs"
      :tabs="[{ value: 'editor', name: $t('Widget Editor') }, { value: 'code', name: $t('HTML CSS') }]"
      @input="value => updateTopTab(value)"
      :value="currentTopTab"
    />
    <div class="content-container">
      <display class="display" :sourceId="previewSource.sourceId" @click="createProjector"/>
      <div class="sidebar">
        <div class="subsection" v-if="slots" v-for="slot in slots" :key="slot.value">
          <span class="subsection__title">{{ slot.label }}</span>
          <div class="subsection__content"><slot :name="slot.value"></slot></div>
        </div>
        <div class="subsection">
          <span class="subsection__title">{{ $t('Sources and Settings') }}</span>
          <ul style="margin: 0;">
            <li
              class="subsection__content settings-title"
              v-for="setting in settings"
              :key="setting.value"
              @click="$emit('input', setting.value)"
            >{{ setting.label }}</li>
          </ul>
        </div>
        <div class="subsection">
          <span class="subsection__title">{{ $t('Selected Properties') }}</span>
          <div class="subsection__content">
            <slot :name="`${value}-properties`"></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./WidgetEditor.vue.ts"></script>

<style lang="less">
  @import "../../../styles/index";

  .widget-editor__top-tabs {
    height: 36px !important;
    width: 100%;

    .tab-button {
      height: 36px;
      position: relative;
      bottom: -1px;
    }
  }

  .night-theme {
    .widget-editor__top-tabs {
      background-color: @night-section !important;
      border-bottom: 1px solid #274959 !important;
    }
  }
</style>

<style lang="less" scoped>
  @import "../../../styles/index";

  .container {
    position: relative;
  }

  .top-settings {
    height: 50px;
    width: 100%;
    display: flex;
  }

  .test-button {
    margin-left: auto;
  }

  .content-container {
    display: flex;
    width: 100%;
    height: calc(~"100% - 86px");
  }

  .display {
    width: 75%;
    height: 100%;
  }

  .sidebar {
    width: 25%;
    height: 100%;
    font-size: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .subsection {
    display: flex;
    flex-direction: column;
    flex-grow: 0;
    flex-shrink: 0;

    &:last-of-type {
      flex-shrink: 1;
      flex-grow: 1;
    }
  }

  .subsection__title {
    display: block;
    width: 100%;
    padding: 8px;
    text-transform: uppercase;
  }

  .subsection__content {
    padding: 8px;
    overflow: hidden;
    overflow-y: auto;
  }

  .settings-title {
    margin: 0;
    list-style: none;
    .transition();

    &:hover {
      cursor: pointer;
    }
  }

  .night-theme {
    .sidebar {
      background-color: @night-section;
      border-left: 1px solid #274959;
    }
    .subsection:not(:first-of-type) .subsection__title {
      border-top: 1px solid #274959;
    }
    .subsection__title {
      background-color: @night-accent-dark;
      border-bottom: 1px solid #274959;
    }

    .settings-title {
      border-bottom: 1px solid @night-accent-dark;
      &:hover,
      &.is-active {
        background-color: #10222c;
      }
    }
  }
</style>
