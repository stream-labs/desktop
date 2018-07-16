<template>
  <div class="row">
    <div class="col-xs-4">
      {{ $t(title || defaultTitle) }}
    </div>
    <div class="col-xs-8">
      <component v-if="type" :is="componentName" :value="value" @input="value => $emit('input', value)" :metadata="metadata"/>
      <slot v-if="!type"></slot>
      <div v-if="metadata && metadata.description" class="whisper">
        {{ metadata.description }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./WFormGroup.vue.ts"></script>

<style lang="less" scoped>
  .row {
    margin-bottom: 20px;
  }

  .whisper {
    margin-top: 6px;
    font-size: 11px;
    font-style: italic;
  }
</style>