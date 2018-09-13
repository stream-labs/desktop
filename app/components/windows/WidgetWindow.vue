<template>
<modal-layout
  :title="windowTitle"
  :showControls="false"
  :customControls="true"
  :fixedSectionHeight="254"
  v-if="widget.previewSourceId">

  <div slot="fixed">
    <display class="display" :sourceId="widget.previewSourceId" @click="createProjector"/>
    <tabs ref="tabs" :tabs="tabs" :value="value" @input="value => $emit('input', value)"></tabs>
  </div>

  <div slot="content" class="content">

    <!-- browser-source properties tab -->
    <div v-if="value === 'source'">
      <GenericForm v-model="properties" @input="onPropsInputHandler"/>
    </div>

    <div v-if="value !== 'source'">

      <div v-if="loaded">
        <div v-for="tabItem in extraTabs" :key="tabItem.value" v-if="tabItem.value === value">
          <slot :name="tabItem.value"></slot>
        </div>

        <slot name="settings" v-if="value === 'settings'"></slot>
        <code-editor v-if="value === 'html'" key="html" :value="wData" :metadata="{ type: 'html' }"/>
        <code-editor v-if="value === 'css'"  key="css" :value="wData" :metadata="{ type: 'css' }"/>
        <code-editor v-if="value === 'js'" key="js" :value="wData" :metadata="{ type: 'js' }"/>
        <custom-fields-editor v-if="value === 'customFields'" :value="wData"/>
        <slot name="test" v-if="value === 'test'"></slot>
      </div>

      <div v-if="loadingFailed">
        {{ $t('Failed to load settings') }}
      </div>

    </div>
  </div>

  <!-- buttons -->
  <div slot="controls">

    <div v-for="tabItem in tabs" :key="tabItem.value" v-if="tabItem.value === value">
      <slot :name="tabItem.value + '-controls'" v-if="hasControls">
        <button
          class="button button--default"
          @click="close">
          {{ $t('Close') }}
        </button>
      </slot>
    </div>

  </div>

</modal-layout>
</template>

<script lang="ts" src="./WidgetWindow.vue.ts"></script>

<style lang="less" scoped>
  .display {
    height: 200px !important;
    cursor: pointer;
  }
</style>
