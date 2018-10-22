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
      <div style="position: relative;">
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
        <div class="custom-code__divider" :class="{ hidden: currentTopTab !== 'code' }" />
        <div class="custom-code__alert" :class="{ active: customCodeIsEnabled }" />
      </div>

      <div class="content-container" :class="{ vertical: currentTopTab === 'code', 'has-leftbar': isAlertBox }">
        <div class="display">
          <display v-if="!animating" :sourceId="widget.previewSourceId" @click="createProjector"/>
        </div>
        <div v-if="isAlertBox" class="left-toolbar"><slot name="leftbar" /></div>
        <div class="sidebar">
          <div class="subsection" v-if="slots" v-for="slot in slots" :key="slot.value">
            <span class="subsection__title">{{ slot.label }}</span>
            <div class="subsection__content custom"><slot :name="slot.value" /></div>
          </div>
          <div class="subsection">
            <span class="subsection__title">{{ $t('Sources and Settings') }}</span>
            <ul style="margin: 0;">
              <li
                class="subsection__content settings-title"
                v-for="setting in navItems"
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
            <code-editor
              v-if="apiSettings.customCodeAllowed && currentCodeTab === 'HTML'"
              key="html"
              :value="selectedVariation || wData"
              :metadata="{ type: 'html' }"
            />
            <code-editor
              v-if="apiSettings.customCodeAllowed && currentCodeTab === 'CSS'"
              key="css"
              :value="selectedVariation || wData"
              :metadata="{ type: 'css' }"
            />
            <code-editor
              v-if="apiSettings.customCodeAllowed && currentCodeTab === 'JS'"
              key="js"
              :value="selectedVariation || wData"
              :metadata="{ type: 'js' }"
            />
            <custom-fields-editor
              v-if="apiSettings.customFieldsAllowed && currentCodeTab === 'customFields'"
              key="customFields"
              :value="selectedVariation || wData"
            />
          </div>
          <div v-else-if="loadingFailed" style="padding: 8px;">
            <div>{{ $t('Failed to load settings') }}</div>
            <button class="button button--warn retry-button" @click="retryDataFetch()">{{ $t('Retry') }}</button>
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
      border-bottom: 1px solid @night-slider-bg !important;
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
    border: 1px solid @day-border;
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
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    background-color: @day-section;
    border-right: 1px solid @day-border;
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
    font-size: 12px;
    position: absolute;
    right: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-left: 1px solid @day-border;
    background-color: @day-section;
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
    display: block;
    width: 100%;
    padding: 8px;
    text-transform: uppercase;
    background-color: @light-2;
    border-bottom: 1px solid @day-border;
    white-space: nowrap;
  }

  .subsection__content {
    padding: 8px;
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
    position: absolute;
    bottom: 0;
    border-top: 1px solid @day-border;
    background-color: @day-section;
    .transition();
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
    transition-delay: 600ms;

    span {
      padding-left: 8px;
    }
  }

  .custom-code.hidden {
    left: 100px;
    opacity: 0;
    border-left: none;
    transition: none;
    transition-delay: 0ms;
  }

  .custom-code__divider {
    position: absolute;
    left: 100px;
    border-right: 1px solid @day-border;
    width: 100px;
    margin: 8px;
    height: 24px;
    top: 0;
    background-color: @white;
    transition-delay: 600ms;
  }

  .custom-code__divider.hidden {
    border-right: none;
    transition-delay: 0ms;
  }

  .custom-code__alert {
    border-radius: 100%;
    width: 6px;
    height: 6px;
    position: absolute;
    top: 50%;
    left: 194px;
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
    .window-container {
      border-color: @night-slider-bg;
    }
    .display, .content-container, .left-toolbar {
      background-color: @night-section-bg;
    }
    .custom-code__divider {
      background-color: @night-section;
      border-color: @night-slider-bg;
    }
    .left-toolbar {
      border-color: @night-slider-bg;
    }
    .sidebar {
      background-color: @night-section;
      border-color: @night-slider-bg;
    }
    .subsection:not(:first-of-type) .subsection__title {
      border-color: @night-slider-bg;
    }
    .subsection__title {
      background-color: @night-accent-dark;
      border-color: @night-slider-bg;
    }
    .settings-title {
      border-color: @night-accent-dark;
      &:hover,
      &.active {
        background-color: @night-primary;
      }
    }
    .code-editor {
      border-color: @night-slider-bg;
      background-color: @night-section-bg;
    }
    .custom-code__alert {
      background-color: @dark-4;
    }
    .custom-code__alert.active {
      background-color: @teal;
    }
  }
</style>
