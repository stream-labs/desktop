<template>
<div class="Hotkey">
  <div class="Hotkey-description">
    {{ description }}
  </div>
  <div class="Hotkey-bindings">
    <transition-group name="bindings" tag="div">
      <div v-for="(binding, index) in bindings" :key="binding.key">
        <input
          type="text"
          class="Hotkey-input"
          :value="binding.binding"
          @keydown="e => handleKeydown(e, index)"/>
        <i
          class="Hotkey-control fa fa-plus"
          @click="addBinding(index)"/>
        <i
          class="Hotkey-control fa fa-minus"
          @click="removeBinding(index)"/>
      </div>
    </transition-group>
  </div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { compact } from 'lodash';
import { Hotkey } from '../../services/hotkeys';

interface IBinding {
  binding: string;
  key: string;
}

@Component({
  props: ['hotkey']
})
export default class HotkeyComponent extends Vue {

  @Prop()
  hotkey: Hotkey;

  description = this.hotkey.description;
  bindings: IBinding[] = [];

  created() {
    if (this.hotkey.accelerators.size === 0) {
      this.bindings = [this.createBindingWithKey('')];
    } else {
      this.bindings = Array.from(this.hotkey.accelerators.values()).map(binding => {
        return this.createBindingWithKey(binding);
      });
    }
  }

  handleKeydown(event: KeyboardEvent, index: number) {
    event.preventDefault();

    if (this.isModifierPress(event)) return;

    const keys = [];

    keys.push(this.getModifier(event));
    keys.push(event.key);

    const accelerator = compact(keys).join('+');
    const binding = this.bindings[index];

    binding.binding = accelerator;

    this.setBindings();
  }

  getModifier(event: KeyboardEvent) {
    if (event.altKey) return 'Alt';
    if (event.ctrlKey) return 'Ctrl';
    if (event.metaKey) return 'Super';
    if (event.shiftKey) return 'Shift';

    return '';
  }

  isModifierPress(event: KeyboardEvent) {
    return (event.key === 'Control') ||
      (event.key === 'Alt') ||
      (event.key === 'Meta') ||
      (event.key === 'Shift');
  }

  // Adds a new blank binding
  addBinding(index: number) {
    this.bindings.splice(index + 1, 0, this.createBindingWithKey(''));
  }

  removeBinding(index: number) {
    // If this is the last binding, replace it with an
    // empty binding instead.
    if (this.bindings.length === 1) {
      this.bindings[0].binding = '';
    } else {
      this.bindings.splice(index, 1);
    }

    this.setBindings();
  }

  // This is kind of weird, but the key attribute allows
  // us to uniquely identify that binding in the DOM,
  // which allows CSS animations to work properly.
  createBindingWithKey(binding: string): IBinding {
    return {
      binding,
      key: Math.random().toString(36).substring(2, 15)
    };
  }

  // Sets the bindings on the hotkey object
  setBindings() {
    const set = new Set();

    this.bindings.forEach(binding => {
      if (binding.binding) set.add(binding.binding);
    });

    this.hotkey.accelerators = set;
  }

}
</script>

<style lang="less" scoped>
.Hotkey {
  display: flex;
  flex-direction: row;
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
