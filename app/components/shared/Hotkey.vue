<template>
<div class="hotkey">
  <div class="Hotkey-description">
    {{ description }}
  </div>
  <div class="Hotkey-bindings">
    <transition-group name="bindings" tag="div">
      <div v-for="(binding, index) in bindings" :key="binding.key">
        <input
          type="text"
          class="Hotkey-input"
          :value="getBindingString(binding.binding)"
          @keydown="e => handleKeydown(e, index)"/>
        <i
          class="Hotkey-control icon-plus"
          @click="addBinding(index)"/>
        <i
          class="Hotkey-control icon-minus"
          @click="removeBinding(index)"/>
      </div>
    </transition-group>
  </div>
</div>
</template>

<script lang="ts" src="./Hotkey.vue.ts"></script>

<style lang="less" scoped>
.hotkey {
  display: flex;
  flex-direction: row;

  & + & {
    margin-top: 20px;
  }
}

.Hotkey-description {
  width: 200px;
  padding-right: 10px;
}

.Hotkey-input {
  display: inline-block;
  width: 150px;
}

.Hotkey-control {
  margin-left: 15px;
  cursor: pointer;
  opacity: 0.6;

  &:hover {
    opacity: 1.0;
  }
}

.bindings-enter-active, .bindings-leave-active {
  transition: all 0.2s;
}

.bindings-enter, .bindings-leave-to {
  opacity: 0;
  transform: scale(1, 0);
}
</style>
