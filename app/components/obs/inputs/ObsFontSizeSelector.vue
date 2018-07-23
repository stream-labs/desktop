<template>
<div class="input-container">
  <div class="input-label">
    <label>Font Size</label>
  </div>
  <div class="input-wrapper">
    <multiselect
      class="multiselect--font"
      :value="value"
      :options="fontSizePresets"
      :close-on-select="true"
      :allow-empty="false"
      @input="setFontSizePreset">
      <template slot="option" slot-scope="props">
        <span>
          {{ props.option }}
        </span>
      </template>
    </multiselect>
  </div>
</div>
</template>

<script lang="ts" src="./ObsFontSizeSelector.vue.ts"></script>
