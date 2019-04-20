<template>
  <div class="hotkey" :data-test-id="description.replace(/\s+/, '_')">
    <div class="Hotkey-description">{{ description }}</div>
    <div class="Hotkey-bindings">
      <transition-group name="bindings" tag="div" class="Hotkey-bindings-transition">
        <div
          v-for="(binding, index) in bindings"
          :key="binding.key"
          class="hotkey-bindings__binding"
        >
          <input
            type="text"
            class="Hotkey-input"
            :value="getBindingString(binding.binding)"
            @keydown="e => handleKeydown(e, index)"
          />
          <select class="Hotkey-select" @change="e => changedMouseSelect(e, index)">
            <option>(None)</option>
            <option :selected="binding.binding.key == 'LeftMouseButton'" :value="'LeftMouseButton'">Left Mouse</option>
            <option :selected="binding.binding.key == 'MiddleMouseButton'" :value="'MiddleMouseButton'">Middle Mouse</option>
            <option :selected="binding.binding.key == 'RightMouseButton'" :value="'RightMouseButton'">Right Mouse</option>
            <option :selected="binding.binding.key == 'X1MouseButton'" :value="'X1MouseButton'">Mouse Back</option>
            <option :selected="binding.binding.key == 'X2MouseButton'" :value="'X2MouseButton'">Mouse Forward</option>
          </select>
          <i class="Hotkey-control fa fa-plus" @click="addBinding(index);" />
          <i class="Hotkey-control fa fa-minus" @click="removeBinding(index);" />
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script lang="ts" src="./Hotkey.vue.ts"></script>

<style lang="less" scoped>
@import '../../styles/index';

.hotkey {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  .margin-bottom(2);
}

.Hotkey-bindings, .Hotkey-bindings-transition {
  align-items: baseline;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  width: 100%;
}

.hotkey-bindings__binding {
  align-items: baseline;
  display: flex;
  flex-direction: row;
  .margin-bottom(1);
  width: 100%;
}

.Hotkey-description {
  display: flex;
  flex-basis: 200px;
  padding-right: 10px;
}

.Hotkey-input {
  display:flex;
}

.Hotkey-select {
  display:flex;
  height: unset;
  margin: 0;
  max-width: 150px;
}

.Hotkey-control {
  display: flex;
  margin-left: 15px;
  cursor: pointer;
  opacity: 0.6;

  &:hover {
    opacity: 1;
  }
}

.bindings-enter-active,
.bindings-leave-active {
  .transition();
}

.bindings-enter,
.bindings-leave-to {
  opacity: 0;
  transform: scale(1, 0);
}
</style>
