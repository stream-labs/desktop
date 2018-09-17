<template>
<modal-layout
  :title="windowTitle"
  v-if="widget.previewSourceId"
>
  <div class="container" slot="content">
    <div class="top-settings" v-if="properties">
      <generic-form v-model="topProperties" @input="onPropsInputHandler"/>
      <div class="button button--action test-button">
        <test-widgets />
      </div>
    </div>

    <div class="window-container">
      <div style="position: relative;">
        <tabs
          :showContent="false"
          className="widget-editor__top-tabs"
          :tabs="[{ value: 'editor', name: $t('Widget Editor') }, { value: 'code', name: $t('HTML CSS') }]"
          @input="value => updateTopTab(value)"
          :value="currentTopTab"
        />
        <div class="custom-code" :class="{ hidden: currentTopTab !== 'code' }">
          <toggle-input :value="value" @input="value => updateValue(value)" />
          <span>{{ $t('Enable Custom Code') }}</span>
        </div>
        <div class="custom-code__divider" :class="{ hidden: currentTopTab !== 'code' }" />
        <div class="custom-code__alert" :class="{ active: value }" />
      </div>

      <div class="content-container" ref="content">
        <display class="display" :sourceId="previewSource.sourceId" @click="createProjector"/>
        <div class="sidebar" ref="sidebar">
          <div class="subsection" v-if="slots" v-for="slot in slots" :key="slot.value">
            <span class="subsection__title">{{ slot.label }}</span>
            <div class="subsection__content"><slot :name="slot.value" /></div>
          </div>
          <div class="subsection">
            <span class="subsection__title">{{ $t('Sources and Settings') }}</span>
            <ul style="margin: 0;">
              <li
                class="subsection__content settings-title"
                v-for="setting in settings"
                :class="{ active: currentSetting === setting.value }"
                :key="setting.value"
                @click="updateCurrentSetting(setting.value)"
              >{{ setting.label }}</li>
            </ul>
          </div>
          <div class="subsection">
            <span class="subsection__title">{{ $t('Selected Properties') }}</span>
            <div class="subsection__content" v-if="currentSetting !== 'source'">
              <slot :name="`${currentSetting}-properties`" v-if="!loadingFailed"/>
              <div v-else>
                {{ $t('Failed to load settings') }}
              </div>
            </div>
            <div class="subsection__content" v-if="currentSetting === 'source'">
              <generic-form v-model="sourceProperties" @input="onPropsInputHandler"/>
            </div>
          </div>
        </div>

        <div class="code-editor hidden" ref="code">
          <tabs
            :showContent="false"
            className="widget-editor__top-tabs"
            :tabs="codeTabs"
            @input="value => updateCodeTab(value)"
            :value="currentCodeTab"
          />
          <div v-for="tab in codeTabs" :key="tab.value">
            <slot :name="tab.value" v-if="tab.value === currentCodeTab" />
          </div>
        </div>
      </div>
    </div>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./WidgetEditor.vue.ts"></script>

<style lang="less">
  @import "../../styles/index";

  .widget-editor__top-tabs {
    height: 36px !important;
    width: 100%;

    .tab-button {
      text-transform: uppercase;
      height: 36px;
      font-size: 12px;
      position: relative;
      bottom: -1px;
      z-index: 1;
    }
  }

  .night-theme {
    .widget-editor__top-tabs {
      background-color: @night-section !important;
      border-bottom: 1px solid @night-editor-border !important;
    }
  }

  .top-settings {
    .input-container {
      margin-bottom: 0;
      width: auto;
      flex-direction: column;
      margin-right: 8px;
      margin-bottom: 16px;
    }
    .int-input{
      width: 60px;
    }
    input[type=text] {
      height: 28px;
    }
  }

  .subsection__content {
    .input-wrapper {
      width: 100%;
    }
    .input-label {
      width: 0;
      padding: 0;
    }
  }

  .test-button .link {
    color: @white;
  }
</style>

<style lang="less" scoped>
  @import "../../styles/index";

  .container {
    position: relative;
  }

  .window-container {
    border: 1px solid @day-editor-border;
  }

  .top-settings {
    height: 50px;
    width: 100%;
    display: flex;
    align-items: center;
    font-size: 12px;

    > div {
      display: flex;
      align-items: center;
    }
  }

  .top-input {
    display: flex;
    position: relative;
    align-items: center;

    span {
      margin-left: 4px;
    }

    .number-input {
      width: 60px !important;
    }
  }

  .window-container {
    height: calc(~"100% - 51px");
  }

  .test-button {
    margin-left: auto;
  }

  .content-container {
    display: flex;
    width: 100%;
    height: calc(~"100% - 36px");
  }

  .content-container.vertical {
    flex-direction: column;
  }

  .display {
    width: 100%;
    height: 100%;
    flex-shrink: 2;
  }

  .sidebar {
    width: 35%;
    height: 100%;
    font-size: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid @day-editor-border;
    background-color: @day-section;
    .transition();
  }

  .sidebar.hidden {
    width: 0;
    height: 0;
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

  .subsection:not(:first-of-type) .subsection__title {
    border-top: 1px solid @day-editor-border;
  }

  .subsection__title {
    display: block;
    width: 100%;
    padding: 8px;
    text-transform: uppercase;
    background-color: @day-editor-accent;
    border-bottom: 1px solid @day-editor-border;
  }

  .subsection__content {
    padding: 8px;
    overflow: hidden;
    overflow-y: auto;
  }

  .source-property {
    display: flex;
  }

  .settings-title {
    margin: 0;
    list-style: none;
    border-bottom: 1px solid @day-secondary;
    .transition();

    &:hover,
    &.active {
      cursor: pointer;
      background-color: @teal-light-opac;
    }
  }

  .code-editor {
    height: 60%;
    width: 100%;
    border-top: 1px solid @day-editor-border;
    background-color: @day-section;
    .transition();
  }

  .code-editor.hidden {
    height: 0;
    width: 0;
    visibility: collapse;
  }

  .custom-code {
    position: absolute;
    display: flex;
    margin: 8px;
    top: 0;
    left: 200px;
    padding-left: 8px;
    align-items: center;
    height: 24px;
    .transition();

    span {
      padding-left: 8px;
    }
  }

  .custom-code.hidden {
    left: 100px;
    opacity: 0;
    border-left: none;
    transition: none;
  }

  .custom-code__divider {
    position: absolute;
    left: 100px;
    border-right: 1px solid @day-editor-border;
    width: 100px;
    margin: 8px;
    height: 24px;
    top: 0;
    background-color: @day-section;
  }

  .custom-code__divider.hidden {
    border-right: none;
  }

  .custom-code__alert {
    border-radius: 100%;
    width: 6px;
    height: 6px;
    position: absolute;
    top: 50%;
    left: 190px;
    transform: translate(0, -50%);
    background-color: @light-4;
  }

  .custom-code__alert.active {
    background-color: @teal;
  }

  .night-theme {
    .window-container {
      border-color: @night-slider-bg;
    }
    .custom-code__divider {
      background-color: @night-section;
      border-color: @night-editor-border;
    }
    .sidebar {
      background-color: @night-section;
      border-color: @night-editor-border;
    }
    .subsection:not(:first-of-type) .subsection__title {
      border-color: @night-editor-border;
    }
    .subsection__title {
      background-color: @night-accent-dark;
      border-color: @night-editor-border;
    }
    .settings-title {
      border-color: @night-accent-dark;
      &:hover,
      &.active {
        background-color: @night-editor-accent;
      }
    }
    .code-editor {
      border-color: @night-editor-border;
      background-color: @night-section-bg;
    }
    .custom-code__alert {
      background-color: @dark-4;
    }
  }
</style>
