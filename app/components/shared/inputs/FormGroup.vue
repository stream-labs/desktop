<template>
  <div class="row">
    <div class="col-xs-4">
      {{ options.title }}
    </div>
    <div class="col-xs-8">
      <div class="input-container">
        <form-input
          :value="value"
          :metadata="formInputMetadata"
          @input="value => $emit('input', value)"
        />
        <div v-if="$slots.default" class="slots">
          <slot></slot>
        </div>
        <div v-if="options.tooltip" class="tooltip">
          <i class="icon-question icon-btn" v-tooltip="metadata.tooltip" />
        </div>
      </div>
      <div v-if="options.description" class="whisper">
        {{ options.description }}
      </div>
    </div>
  </div>
</template>


<script lang="ts" src="./FormGroup.vue.ts"></script>

<style lang="less" scoped>
  @import "../../../styles/index";

  .input-container {
    display: flex;
    align-items: center;
    width: 100%;
    justify-content: flex-start;
  }

  .slots {
    width: 100%;
  }

  .tooltip {
    position: relative;
    margin-left: 8px;
    font-size: 16px;
    align-self: center;
    display: inline-block;
    z-index: 1;
    color: @icon;
  }

  .whisper {
    margin-top: 6px;
    font-size: 11px;
    font-style: italic;
  }
</style>
