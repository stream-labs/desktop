<template>
  <div class="row">
    <div class="col-xs-4">
      {{ $t(title || defaultTitle) }}
    </div>
    <div class="col-xs-8">
      <component v-if="type" :is="componentName" :value="value" :metadata="metadata"/>
      <slot v-if="!type"></slot>
    </div>
  </div>
</template>

<script lang="ts" src="./WFormGroup.vue.ts"></script>

<style lang="less" scoped>
  .row {
    margin-bottom: 20px;
  }
</style>