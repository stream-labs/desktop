<template>
<div class="list-input" data-role="input" data-type="list" :data-name="options.name">
  <label>{{ title }}</label>
  <multiselect
    :value="currentMultiselectValue"
    :options="options.options"
    track-by="value"
    :close-on-select="true"
    :placeholder="placeholder"
    label="title"
    :allow-empty="options.allowEmpty"
    @input="onInputHandler">

    <template slot="option" slot-scope="props">
      <span :data-option-value="props.option.value">{{ props.option.title }}</span>
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

.description {
  margin-top: 6px;
  font-size: 11px;
  font-style: italic;
}
</style>
