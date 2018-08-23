<template>
<modal-layout
  :title="windowTitle"
  :showControls="false"
  :customControls="true"
  :fixedSectionHeight="254"
  v-if="previewSource"
>
  <div class="container">
    <div class="top-settings"></div>
    <tabs />
    <div class="test-button" />
    <display class="display" :sourceId="previewSource.id" @click="createProjector"/>
    <div class="sidebar">
      <div class="subsection" v-if="slots" v-for="slot in slots" :key="slot.value">\
        <span class="subsection__title">{{ slot.label }}</span>
        <slot :name="slot.value"></slot>
      </div>
      <div class="subsection">
        <span class="subsection__title">{{ $t('Sources and Settings') }}</span>
        <ul>
          <li v-for="setting in settings" :key="setting.value">{{ setting.label }}</li>
        </ul>
      </div>
      <div class="subsection">
        <span class="subsection__title">{{ $t('Selected Properties') }}</span>
        <slot v-for="setting in settings" :key="`${setting.value}-properties`" :name="`${setting.value}-properties`"></slot>
      </div>
    </div>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./WidgetEditor.vue.ts"></script>

<style lang="less" scoped>
</style>
