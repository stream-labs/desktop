<template>
  <div class="list-input" data-role="input" data-type="list" :data-name="options.name" style="width: 100%">
    <multiselect
      :options="options.options"
      group-label="label"
      group-values="options"
      track-by="value"
      label="label"
      :allow-empty="false"
      :value="displayValue"
      @input="option => emitInput(option.value)"
      selectLabel=""
      selectedLabel=""
      deselectLabel=""
    />
  </div>
</template>

<script lang="ts" src="./SectionedMultiselectInput.vue.ts"></script>
