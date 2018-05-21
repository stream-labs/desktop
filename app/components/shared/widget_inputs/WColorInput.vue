<template>
  <div>
    <div class="w-form-group">
      <label class="w-form-group__label">{{ value.description }}</label>
      <div class="w-form-group__wrapper">
        <div class="w-form-group__input colorpicker">
          <div
            class="colorpicker__text"
            @click="togglePicker">
            <input
              class="colorpicker__input"
              type="text"
              readonly
              :value="hexARGB">
            <div
              class="colorpicker__swatch"
              :style="swatchStyle"/>
          </div>
          <color-picker
            v-model="color"
            v-if="pickerVisible"
            @change-color="onChange"
            class="colorpicker-menu"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./WColorInput.vue.ts"></script>
