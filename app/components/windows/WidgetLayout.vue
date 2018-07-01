<template>
<modal-layout
  :title="windowTitle"
  :showControls="false"
  :customControls="true"
  :fixedSectionHeight="240">

  <div slot="fixed">
    <display v-if="source" :sourceId="source.id" style="height: 200px"/>
    <tabs class="tabs-place" ref="tabs" :tabs="tabs" :value="value" @input="value => $emit('input', value)"></tabs>
  </div>

  <div slot="content">

    <div v-if="value === 'source'">
      <GenericForm v-model="properties" @input="onPropsInputHandler"/>
    </div>

    <div v-for="tab in tabs" >
      <div v-if="tab.value !== 'source'">
        <slot :name="tab.value"  v-if="tab.value === value"></slot>
      </div>
    </div>
  </div>

  <div slot="controls">
    <div v-for="tab in tabs" v-if="tab.value === value">
      <slot :name="tab.value + '-controls'">
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
