<template>

  <div>
    <!-- title -->
    <div class="flex margin-vertical--10">
      <div>
        {{ options.title }}
      </div>
      <div v-if="options.tooltip" class="tooltip">
        <i class="icon-question icon-btn" v-tooltip="metadata.tooltip" />
      </div>
    </div>

    <div>
      <!-- input(s) & whisper -->
      <form-input
        :value="value"
        :metadata="formInputMetadata"
        @input="value => $emit('input', value)"
      />

      <div v-if="!type" class="slots">
        <slot></slot>
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


<script lang="ts" src="./VFormGroup.vue.ts"></script>

<style lang="less" scoped>
  @import "../../../styles/index";

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
    line-height: 0;
  }

  .input-footer {
    margin-top: 6px;
    min-height: 16px;
    font-size: 11px;

    .whisper { font-style: italic; }
    .input-error { color: @red; }
  }
</style>
