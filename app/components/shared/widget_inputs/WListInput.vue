<template>
<div class="input-container select" :class="{disabled: value.enabled === false}">
  <div v-if="value.showDescription !== false">
    <label>{{ value.description }}</label>
    <multiselect
      :value="currentValue"
      :disabled="value.enabled === false"
      :options="value.options"
      :internal-search="internalSearch"
      track-by="value"
      :close-on-select="true"
      :allow-empty="allowEmpty"
      :placeholder="placeholder"
      :loading="loading"
      label="description"
      @input="onInputHandler"
      @search-change="onSearchChange">
      <template slot="option" slot-scope="props">
        <span>
          {{ props.option.description }}
        </span>
      </template>
    </multiselect>
  </div>
</div>
</template>

<script lang="ts" src="./WListInput.vue.ts"></script>
