<template>
<div class="input">
  <label>{{ value.description }}</label>
  <div class="ButtonInput">
    <input
      :type="textVisible ? 'text' : 'password'"
      :value="value.currentValue"
      :disabled="value.enabled === 0"
      @change="onInputHandler"
    />
    <button
      class="button button--default"
      v-if="value.masked"
      @click="toggleVisible">
      {{ textVisible ? 'Hide' : 'Show' }}
    </button>
  </div>
</div>
</template>

<script>
import Input from './Input.vue';

let TextInput = Input.extend({

  data() {
    return {
      textVisible: !this.value.masked
    };
  },

  methods: {
    toggleVisible() {
      this.textVisible = !this.textVisible;
    },

    onInputHandler(event) {
      this.$emit('input', Object.assign({}, this.value, { currentValue: event.target.value }));
    }

  }

});
TextInput.obsType = 'OBS_PROPERTY_EDIT_TEXT';
export default TextInput;

</script>

<style lang="less" scoped>
.ButtonInput {
  display: flex;
  flex-direction: row;

  >input {
    flex-grow: 1;
  }

  >button {
    margin-left: 10px;
    width: 80px;
  }
}
</style>
