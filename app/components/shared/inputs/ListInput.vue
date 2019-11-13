<template>
<div
  class="list-input"
  data-role="input"
  data-type="list"
  :data-name="options.name"
  :data-loading="options.loading"
  :class="{ 'full-width': options.fullWidth, disabled: options.disabled }"
  :data-internal-search="options.internalSearch"
>
  <label>{{ title }}</label>
  <multiselect
    :value="currentMultiselectValue"
    :options="options.options"
    track-by="value"
    :close-on-select="true"
    :placeholder="placeholder"
    label="title"
    :allow-empty="options.allowEmpty"
    :internal-search="options.internalSearch"
    :loading="options.loading"
    :disabled="options.disabled"
    :allow-custom="options.allowCustom"
    @input="onInputHandler"
    @search-change="onSearchChange"
  >
    <span
      slot="option"
      slot-scope="props"
      :data-option-value="props.option.value"
      :data-option-title="props.option.title">
      <slot name="item" :option="props.option"><img v-if="props.option.icon" :src="props.option.icon" alt="" class="icon"/>{{ props.option.title }}</slot>
    </span>

    <template v-if="options.noResult" slot="noResult">{{ options.noResult }}</template>
    <template v-if="options.loading" slot="afterList"><spinner/></template>

  </multiselect>
  <div v-if="selectedOption && selectedOption.description" class="description">
    {{ selectedOption.description }}
  </div>
</div>
</template>

<script lang="ts" src="./ListInput.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";

.list-input.full-width {
  width: 100%;
}

.list-input.disabled {
  cursor: not-allowed;
}

.description {
  margin-top: 6px;
  font-size: 11px;
  font-style: italic;
}

.icon {
  display: inline-block;
  max-width: 16px;
  max-height: 16px;
  .margin-right(1);
}

</style>
