<template>
<div class="input-container select" :class="{disabled: value.enabled === false}">
  <div class="input-label">
    <label>{{ value.description }}</label>
  </div>
  <div class="input-wrapper">
    <multiselect
      :value="currentValue"
      :disabled="value.enabled === false"
      :options="value.options"
      track-by="value"
      :close-on-select="true"
      :allow-empty="allowEmpty"
      :placeholder="placeholder"
      :loading="loading"
      label="description"
      @input="onInputHandler"
      @search-change="onSearchChange">
      <template slot="option" scope="props">
        <span>
          {{ props.option.description }}
        </span>
      </template>
    </multiselect>
  </div>
</div>
</template>

<script lang="ts" src="./ListInput.vue.ts"></script>
