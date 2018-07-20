<template>
  <div class="row">
    <div class="col-xs-4">
      {{ options.title }}
    </div>
    <div class="col-xs-8">
      <component
          v-if="options.type"
         :is="componentName"
         :value="value"
         @input="value => $emit('input', value)"
         :metadata="options"
      />
      <slot v-if="!type"></slot>
      <div v-if="options.description" class="whisper">
        {{ options.description }}
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