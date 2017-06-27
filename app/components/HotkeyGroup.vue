<template>
<div class="HotkeyGroup">
  <h4
    class="HotkeyGroup-header"
    v-if="title"
    @click="collapsed = !collapsed">
    <i
      v-if="collapsed === true"
      class="fa fa-plus"/>
    <i
      v-if="collapsed === false"
      class="fa fa-minus"/>
    {{ title }}
  </h4>
  <div v-for="hotkey in hotkeys">
    <hotkey v-show="!collapsed" :hotkey="hotkey" />
  </div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import Hotkey from './shared/Hotkey.vue';

@Component({
  props: {
    title: String,
    hotkeys: Array
  },
  components: { Hotkey }
})
export default class HotkeyGroup extends Vue {

  collapsed = false;

}
</script>

<style lang="less" scoped>
@import "../styles/index";

.HotkeyGroup {
  margin-bottom: -1px;
  background-color: @panel-bg-color;
  border: 1px solid @panel-border-color;
  padding: 20px 30px;
}

.HotkeyGroup-header {
  cursor: pointer;
  opacity: 0.7;

  >i {
    margin-right: 10px;
  }

  &:hover {
    opacity: 1.0;
  }
}
</style>
