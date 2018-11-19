<template>
<div class="section">
  <div class="section-title--dropdown">
    <h4
      v-if="title"
      @click="collapsed = !collapsed">
      <i
        v-if="collapsed === true"
        class="icon-plus"/>
      <i
        v-if="collapsed === false"
        class="icon-minus"/>
      {{ title }}
    </h4>
  </div>
  <hotkey v-for="hotkey in hotkeys" v-show="!collapsed" :hotkey="hotkey" />
</div>
</template>

<script lang="ts" src="./HotkeyGroup.vue.ts"></script>
