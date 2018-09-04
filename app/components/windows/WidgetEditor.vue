<template>
<modal-layout
  :title="windowTitle"
  v-if="previewSource"
>
  <div class="container" slot="content">
    <div class="top-settings" v-if="properties">
      <generic-form v-model="topProperties" @input="onPropsInputHandler"/>
      <button class="button button--action test-button">{{ $t('Test Widget') }}</button>
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
        <div class="custom-code__alert" :class="{ active: value }" />
        <div class="custom-code" :class="{ hidden: currentTopTab !== 'code' }">
          <toggle-input :value="value" @input="value => updateValue(value)" />
          <span>{{ $t('Enable Custom Code') }}</span>
        </div>
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
              <slot :name="`${currentSetting}-properties`" />
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
</style>

<style lang="less" scoped>
  @import "../../styles/index";

  .container {
    position: relative;
  }

  .top-settings {
    height: 50px;
    width: 100%;
    display: flex;
    align-items: center;
    color: #8b9195;
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

  .source-property {
    display: flex;
  }

  .settings-title {
    margin: 0;
    list-style: none;
    .transition();

    &:hover {
      cursor: pointer;
    }
  }

  .code-editor {
    height: 60%;
    width: 100%;
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
    padding: 8px;
    border-radius: 0 0 3px 3px;
    top: -1px;
    left: 30%;
    border: 1px solid @teal;
    border-top: none;
    height: 37px;
    .transition();
  }

  .custom-code.hidden {
    top: -19px;
    transform: scaleY(0);
  }

  .custom-code__alert {
    border-radius: 100%;
    width: 6px;
    height: 6px;
    position: absolute;
    top: 50%;
    left: 190px;
    transform: translate(0, -50%);
    background-color: #2e383f;
  }

  .custom-code__alert.active {
    background-color: @teal;
  }

  .night-theme {
    .window-container {
      border: 1px solid @night-slider-bg;
    }
    .custom-code {
      background-color: @night-section;
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
      &.active {
        background-color: #10222c;
      }
    }
    .code-editor {
      border-top: 1px solid #274959;
      background-color: @night-section-bg;
    }
  }
</style>
