<template>
<modal-layout
  :title="windowTitle"
  :showControls="false"
  :customControls="true"
  :fixedSectionHeight="300">

  <div slot="fixed">
    <display v-if="source" :sourceId="source.id" style="height: 200px"/>
    <div class="description">
      <slot name="description"></slot>
    </div>
    <tabs ref="tabs" :tabs="tabsList" :value="value" @input="value => $emit('input', value)"></tabs>
  </div>

  <div slot="content">

    <div v-if="value === 'source'">
      <GenericForm v-model="properties" @input="onPropsInputHandler"/>
    </div>

    <div v-for="tabItem in tabsList" >
      <div v-if="tabItem.value !== 'source'">
        <slot :name="tabItem.value" v-if="tabItem.value === value"></slot>
      </div>
    </div>
  </div>

  <div slot="controls" v-if="tab && tab.showControls">
    <div v-for="tabItem in tabsList" v-if="tabItem.value === value">
      <slot :name="tabItem.value + '-controls'">
        <button
            class="button button--action"
            @click="close">
          {{ $t('Close') }}
        </button>
      </slot>
    </div>
  </div>


</modal-layout>
</template>

<script lang="ts" src="./WidgetLayout.vue.ts"></script>

<style lang="less" scoped>

  .description {
    padding: 20px;
  }

</style>
