<template>
<div class="input checkbox" :class="{disabled: !value.enabled}">
  <input
    type="checkbox"
    :checked="value.currentValue"
    :disabled="!value.enabled"
    @change="onChangeHandler"
  />
  <label>{{ value.description }}</label>
</div>
</template>

<script>

import Input from './Input.vue';

const BoolInput = Input.extend({
  methods: {
    onChangeHandler(event) {
      this.$emit('input', Object.assign({}, this.value, {
        currentValue: Number(event.target.checked)
      }));
    }
  }
});

BoolInput.obsType = 'OBS_PROPERTY_BOOL';

export default BoolInput;

</script>
