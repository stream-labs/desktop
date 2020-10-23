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
      :taggable="options.taggable"
      @input="onInputHandler"
      @search-change="onSearchChangeHandler"
      @open="handleOpen && handleOpen()"
      selectLabel=""
      deselectLabel=""
    >
      <span
        slot="option"
        slot-scope="itemProps"
        :data-option-value="itemProps.option.value"
        :data-option-title="itemProps.option.title"
      >
        <slot name="item" :option="props.option">
          <img
            v-if="itemProps.option.icon"
            :src="itemProps.option.icon"
            alt=""
            class="icon"
            :style="iconSizeStyle"
          />
          <div
            v-if="itemProps.showIconPlaceholder && !itemProps.option.icon"
            class="icon-placeholder"
            :style="iconSizeStyle"
          />
          {{ itemProps.option.title }}</slot
        >
      </span>

      <template slot="singleLabel" slot-scope="itemProps">
        <img v-if="itemProps.option.icon" :src="itemProps.option.icon" alt="" class="icon" />
        <div v-if="props.showIconPlaceholder && !itemProps.option.icon" class="icon-placeholder" />
        {{ itemProps.option.title }}
      </template>
      <template v-if="options.noResult" slot="noResult">{{ options.noResult }}</template>
      <template v-if="options.loading" slot="afterList"><spinner /></template>
    </multiselect>
    <div v-if="selectedOption && selectedOption.description" class="description">
      {{ selectedOption.description }}
    </div>
  </div>
</template>

<script lang="ts" src="./ListInput.vue.ts"></script>

<style lang="less" scoped>
@import '../../../styles/index';

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

.icon,
.icon-placeholder {
  display: inline-block;
  width: 16px;
  height: 16px;
  .margin-right(1);
}
</style>
