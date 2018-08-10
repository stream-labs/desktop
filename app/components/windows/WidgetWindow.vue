<template>
<modal-layout
  :title="windowTitle"
  :showControls="false"
  :customControls="true"
  v-if="previewSource">

  <div slot="fixed">
    <display class="display" :sourceId="previewSource.id" @click="createProjector"/>
    <tabs ref="tabs" :tabs="tabsList" :value="value" @input="value => $emit('input', value)"></tabs>
  </div>

  <div slot="content" class="content">

    <!-- browser-source properties tab -->
    <div v-if="value === 'source'">
      <GenericForm v-model="properties" @input="onPropsInputHandler"/>
    </div>

    <!-- other tabs -->
    <div v-for="tabItem in tabsList" :key="tabItem.value">
      <div v-if="tabItem.value !== 'source'">
        <slot :name="tabItem.value" v-if="tabItem.value === value"></slot>
      </div>
    </div>
  </div>

  <!-- buttons -->
  <div slot="controls" v-if="tab && tab.showControls">
    <div v-for="tabItem in tabsList" :key="tabItem.value" v-if="tabItem.value === value">
      <slot :name="tabItem.value + '-controls'">
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

  .description {
    padding: 20px;
  }

  .display {
    height: 200px !important;
    cursor: pointer;
  }

</style>
