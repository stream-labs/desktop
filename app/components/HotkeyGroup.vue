<template>
<div class="section">
  <div class="section-title--dropdown">
    <h4
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
  </div>
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
