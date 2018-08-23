<template>
<modal-layout
  title="windowTitle"
>
  <div class="container" slot="content">
    <div class="top-settings"></div>
    <!-- <tabs />
    <div class="test-button" />
    <display class="display" :sourceId="previewSource.id" @click="createProjector"/> -->
    <div class="sidebar">
      <div class="subsection" v-if="slots" v-for="slot in slots" :key="slot.value">\
        <span class="subsection__title">{{ slot.label }}</span>
        <slot :name="slot.value"></slot>
      </div>
      <div class="subsection">
        <span class="subsection__title">{{ $t('Sources and Settings') }}</span>
        <ul style="margin: 0;">
          <li class="subsection__content settings-title" v-for="setting in settings" :key="setting.value">{{ setting.label }}</li>
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
</modal-layout>
</template>

<script lang="ts" src="./WidgetEditor.vue.ts"></script>

<style lang="less" scoped>
  @import "../../../styles/index";

  .sidebar {
    width: 25%;
    float: right;
    height: 100%;
    font-size: 12px;
  }

  .subsection__title {
    display: block;
    width: 100%;
    padding: 8px;
    text-transform: uppercase;
  }

  .subsection__content {
    padding: 8px;
  }

  .settings-title {
    border-bottom: 1px solid @night-accent-dark;
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
    .subsection__title {
      background-color: @night-accent-dark;
      border-top: 1px solid #274959;
      border-bottom: 1px solid #274959;
    }

    .settings-title {
      &:hover,
      &.is-active {
        background-color: #10222c;
      }
    }
  }
</style>
