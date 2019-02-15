<template>
  <div class="row alignable-input">
    <div class="input-label">
      <label>
        {{ options.title }}
      </label>
    </div>
    <div class="input-body">
      <div class="input-container input-container--no-margin">
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

      <div class="input-footer" v-if="options.description || inputErrors.length">
        <div class="whisper" v-if="options.description && !inputErrors.length">
          {{ options.description }}
        </div>
        <div class="input-error" v-if="inputErrors.length">
          {{ inputErrors[0].msg }}
        </div>
      </div>

    </div>
  </div>
</template>


<script lang="ts" src="./HFormGroup.vue.ts"></script>

<style lang="less" scoped>
  @import "../../../styles/index";

  .row {
    display: flex;
    margin: 0;
    .margin-bottom(1);
  }

  .input-body {
    width: 70%;
    margin-left: auto;
  }

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
    .margin-left();
    font-size: 14px;
    align-self: center;
    display: inline-block;
    z-index: 1;
    color: @icon;
  }

  .input-footer {
    margin-top: 6px;
    min-height: 16px;
    font-size: 11px;

    .whisper { font-style: italic; }
    .input-error { color: @red; }
  }

</style>
