<template>
<modal-layout v-if="widget.previewSourceId">
  <div class="container" slot="content">
    <div class="top-settings" v-if="properties">
      <generic-form v-model="topProperties" @input="onPropsInputHandler"/>
      <div v-if="apiSettings.testers" class="button button--action test-button">
        <test-widgets :testers="apiSettings.testers" />
      </div>
    </div>

    <div class="window-container">
      <div class="editor-tabs" :class="{ pushed: isAlertBox }">
        <tabs
          :hideContent="true"
          className="widget-editor__top-tabs"
          :tabs="topTabs"
          @input="value => updateTopTab(value)"
          :value="currentTopTab"
        />
        <div class="custom-code" v-if="loaded" :class="{ hidden: currentTopTab !== 'code' }">
          <toggle-input :value="customCodeIsEnabled" @input="value => toggleCustomCode(value)" />
          <span>{{ $t('Enable Custom Code') }}</span>
        </div>
        <div class="custom-code__alert" :class="{ active: customCodeIsEnabled }" v-if="topTabs.length > 1" />
      </div>

      <div class="content-container" :class="{ vertical: currentTopTab === 'code', 'has-leftbar': isAlertBox }">
        <div class="display">
          <display v-if="!animating" :sourceId="widget.previewSourceId" @click="createProjector"/>
        </div>
        <div class="sidebar">
          <div class="subsection" v-if="slots" v-for="slot in slots" :key="slot.value">
            <h2 class="subsection__title">{{ slot.label }}</h2>
            <div class="subsection__content custom"><slot :name="slot.value" /></div>
          </div>
          <div class="subsection">
            <h2 class="subsection__title">{{ $t('Sources and Settings') }}</h2>
            <ul style="margin: 0;">
              <li
                class="settings-title"
                v-for="setting in navItems"
                :class="{ active: currentSetting === setting.value }"
                :key="setting.value"
                @click="updateCurrentSetting(setting.value)"
              >{{ setting.label }}</li>
            </ul>
          </div>
          <div class="subsection">
            <h2 class="subsection__title">{{ $t('Selected Properties') }}</h2>
            <div class="subsection__content" v-if="currentSetting !== 'source'">
              <slot :name="`${currentSetting}-properties`" v-if="!loadingFailed"/>
              <div v-else>
                <div>{{ $t('Failed to load settings') }}</div>
                <button class="button button--warn retry-button" @click="retryDataFetch()">{{ $t('Retry') }}</button>
              </div>
            </div>
            <div class="subsection__content" v-if="currentSetting === 'source'">
              <generic-form v-model="sourceProperties" @input="onPropsInputHandler"/>
            </div>
          </div>
        </div>

        <div class="code-editor" v-if="loaded">
          <div v-if="customCodeIsEnabled && !loadingFailed">
            <tabs
              :hideConent="true"
              className="widget-editor__top-tabs"
              :tabs="codeTabs"
              v-model="currentCodeTab"
              @input="value => updateCodeTab(value)"
            />
          <div v-if="canShowEditor">
            <code-editor
              v-if="apiSettings.customCodeAllowed && currentCodeTab === 'HTML'"
              key="html"
              :value="wData"
              :metadata="{ type: 'html', selectedId, selectedAlert }"
            />
            <code-editor
              v-if="apiSettings.customCodeAllowed && currentCodeTab === 'CSS'"
              key="css"
              :value="wData"
              :metadata="{ type: 'css', selectedId, selectedAlert }"
            />
            <code-editor
              v-if="apiSettings.customCodeAllowed && currentCodeTab === 'JS'"
              key="js"
              :value="wData"
              :metadata="{ type: 'js', selectedId, selectedAlert }"
            />
            <custom-fields-editor
              v-if="apiSettings.customFieldsAllowed && currentCodeTab === 'customFields'"
              key="customFields"
              :value="wData"
              :metadata="{ selectedId, selectedAlert }"
            />
          </div>
          </div>
          <div v-else-if="loadingFailed" style="padding: 8px;">
            <div>{{ $t('Failed to load settings') }}</div>
            <button class="button button--warn retry-button" @click="retryDataFetch()">{{ $t('Retry') }}</button>
          </div>
        </div>
      </div>

      <div v-if="isAlertBox" class="left-toolbar"><slot name="leftbar" /></div>
    </div>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./WidgetEditor.vue.ts"></script>

<style lang="less">
  @import "../../styles/index";

  .widget-editor__top-tabs {
    padding: 0 16px !important;
  }

  .top-settings {
    .row.alignable-input {
      width: 80px;
      flex-direction: column;

      .input-body {
        margin-left: 0;
      }
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
    overflow: hidden;
    .radius();
    .border();
  }

  .top-settings {
    width: 100%;
    display: flex;
    align-items: center;

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
    height: calc(~"100% - 66px");
  }

  .test-button {
    margin-left: auto;
  }

  .editor-tabs {
    position: relative;
  }

  .editor-tabs.pushed {
    right: 0;
    width: 80%;
    margin-left: auto;
  }

  .content-container {
    display: flex;
    width: 100%;
    height: calc(~"100% - 36px");
    position: relative;
    background-color: @day-section;
    overflow: hidden;

    .code-editor {
      transform: translate(0, 100%);
    }
    .display {
      transform: scale(0.82, .8) translate(-10%);
    }
  }

  .content-container.vertical {
    .sidebar {
      transform: translate(100%);
      transition-delay: 0ms;
    }
    .code-editor {
      transform: translate(0, 0);
      transition-delay: 300ms;
    }
    .display {
      transform: scale(1, 0.63) translate(0, -29%);
    }
  }

  .content-container.has-leftbar {
    .code-editor {
      width: 80%;
      right: 0;
    }
    .display {
      transform: scale(0.7, 0.7) translate(-3.7%);
    }
  }

  .content-container.has-leftbar.vertical {
    .display {
      transform: scale(0.6, 0.6) translate(5%, -31%);
    }
  }

  .left-toolbar {
    width: 20%;
    height: calc(~"100% - 66px");
    position: absolute;
    bottom: 0;
    left: 0;
    border: 1px solid @day-border;
    background-color: @day-bg;
    overflow-y: auto;
  }

  .display {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    background-color: @day-section;
  }

  .sidebar {
    width: 30%;
    height: 100%;
    position: absolute;
    right: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-left: 1px solid @day-border;
    background-color: @day-bg;
    .transition();
    transition-delay: 300ms;
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
    border-top: 1px solid @day-border;
  }

  .subsection__title {
    width: 100%;
    .padding-h-sides(2);
    .padding-v-sides();
    .text-transform();
    border-bottom: 1px solid @day-border;
    white-space: nowrap;
    .margin-bottom(@0);
  }

  .subsection__content {
    .padding(2);
    overflow: hidden;
    overflow-y: auto;
    width: 100%;
    min-width: 260px;
  }

  .subsection__content.custom {
    overflow: visible;
  }

  .source-property {
    display: flex;
  }

  .settings-title {
    margin: 0;
    list-style: none;
    .transition();
    cursor: pointer;
    .padding-h-sides(2);
    line-height: 32px;

    &:hover,
    &.active {
      background-color: @light-3;
    }

    &.active {
      color: @day-title;
      .weight(@medium);
    }
  }

  .code-editor {
    height: 60%;
    width: 100%;
    position: absolute;
    bottom: 0;
    border-top: 1px solid @day-border;
    background-color: @day-bg;
    .transition();
  }

  .custom-code {
    position: absolute;
    display: flex;
    top: 0;
    left: 215px;
    align-items: center;
    height: 24px;
    .margin-left();
    .padding-left();
    .transition();
    border-left: 1px solid @day-border;
    margin: 12px 0;

    span {
      .padding-left();
    }
  }

  .custom-code.hidden {
    left: 100px;
    opacity: 0;
    border-left: none;
    z-index: -1;
  }

  .custom-code__alert {
    border-radius: 100%;
    width: 6px;
    height: 6px;
    position: absolute;
    top: calc(~"50% - 3px");
    left: 200px;
    transform: translate(0, -50%);
    background-color: @light-4;
  }

  .custom-code__alert.active {
    background-color: @teal;
  }

  .retry-button {
    margin-top: 16px;
  }

  .night-theme {
    .display,
    .content-container {
      background-color: @night-section;
    }

    .left-toolbar {
      background-color: @night-bg;
    }

    .window-container {
      border-color: @night-border;
    }

    .custom-code {
      border-color: @night-border;
    }
    .left-toolbar {
      border-color: @night-slider-bg;
    }
    .sidebar {
      background-color: @night-bg;
      border-color: @night-border;
    }

    .subsection:not(:first-of-type) .subsection__title {
      border-color: @night-border;
    }

    .subsection__title {
      background-color: @night-section;
      border-color: @night-border;
    }

    .settings-title {
      border-color: @night-accent-dark;

      &:hover,
      &.active {
        background-color: @night-hover;
      }

      &.active {
        color: @night-title;
      }
    }

    .code-editor {
      border-color: @night-border;
      background-color: @night-bg;
    }

    .custom-code__alert {
      background-color: @dark-4;
    }

    .custom-code__alert.active {
      background-color: @teal;
    }
  }
</style>
