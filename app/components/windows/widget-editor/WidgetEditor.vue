<template>
<modal-layout
  :title="windowTitle"
  v-if="previewSource"
>
  <div class="container" slot="content">
    <div class="top-settings"><button class="button button--action test-button">{{ $t('Test Widget') }}</button></div>
    <div class="tabs" />
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
              @input="value => $emit('input', value)"
            >{{ setting.label }}</li>
          </ul>
        </div>
        <div class="subsection">
          <span class="subsection__title">{{ $t('Selected Properties') }}</span>
          <div class="subsection__content" v-for="setting in settings" :key="`${setting.value}-properties`">
            <slot :name="`${setting.value}-properties`"></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./WidgetEditor.vue.ts"></script>

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

  .tabs {
    height: 36px;
    width: 100%;
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
    flex-grow: 1;
    flex-shrink: 0;

    &:last-of-type {
      flex-shrink: 1;
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
    .tabs {
      background-color: @night-section;
      border-bottom: 1px solid #274959;
    }
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
