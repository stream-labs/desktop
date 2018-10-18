<template>
  <div class="row">
    <div class="col-xs-4">
      {{ options.title }}
    </div>
    <div class="col-xs-8">

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

      <div class="input-footer">
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
    .margin-bottom(1);
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
    margin-left: 8px;
    font-size: 16px;
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
