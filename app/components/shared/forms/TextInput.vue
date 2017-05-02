<template>
<div class="input">
  <label>{{ value.description }}</label>
  <input
    type="text"
    :value="value.currentValue"
    :disabled="!value.enabled"
    @change="onInputHandler"
  />
</div>
</template>

<script>
import Input from './Input.vue';

let TextInput = Input.extend({

  methods: {

    onInputHandler(event) {
      this.$emit('input', Object.assign({}, this.value, { currentValue: event.target.value }));
    }

  }

});
TextInput.obsType = 'OBS_PROPERTY_EDIT_TEXT';
export default TextInput;

</script>
