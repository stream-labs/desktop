<template>
<div
  class="list-input"
  data-role="input"
  data-type="list"
  :data-name="options.name"
  :class="{ 'full-width': options.fullWidth }"
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
    <template slot="option" slot-scope="props">
      <span :data-option-value="props.option.value">{{ props.option.title }}</span>
    </template>

    <template v-if="options.noResult" slot="noResult">
      {{ options.noResult }}
    </template>

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

.description {
  margin-top: 6px;
  font-size: 11px;
  font-style: italic;
}
</style>
