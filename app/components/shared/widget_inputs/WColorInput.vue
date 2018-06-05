<template>
  <!-- <div>
    <div class="w-form-group">
      <div class="w-form-group__wrapper">
        <div class="w-form-group__input colorpicker">

          <color-picker
            :value="value"
            @input="updateValue"
            class="colorpicker-menu"/>
        </div>
      </div>
    </div>
  </div> -->

<div class="input-group color-picker" ref="colorpicker">
	<input
    type="text"
    class="form-control"
    :value="value"
    @focus="showPicker()"
    @input="updateFromInput" />

	<span class="input-group-addon color-picker-container">
		<span
      class="current-color"
      :style="'background-color: ' + value"
      @click="togglePicker()"></span>
		<color-picker
      :value="colors"
      @input="updateFromPicker"
      v-if="displayPicker" />
	</span>
</div>
</template>

<script lang="ts" src="./WColorInput.vue.ts"></script>

<style scoped>

.input-group.color-picker {
  position: relative;
}

.vc-sketch {
  position: absolute;
	top: 35px;
	right: 0;
	z-index: 9;
}
</style>
