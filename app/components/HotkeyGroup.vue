<template>
<div class="section">
  <div class="section-title section-title--dropdown">
    <h2
      v-if="title"
      @click="collapsed = !collapsed">
      <i
        v-if="collapsed === true"
        class="fa fa-plus"/>
      <i
        v-if="collapsed === false"
        class="fa fa-minus"/>
      {{ title }}
    </h2>
  </div>
  <div v-for="hotkey in hotkeys" :key="hotkey">
    <hotkey v-show="!collapsed" :hotkey="hotkey" />
  </div>
</div>
</template>

<script lang="ts" src="./HotkeyGroup.vue.ts"></script>
