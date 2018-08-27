<template>
<div class="section">
  <h2
    class="section-title section-title--dropdown"
    v-if="title"
    @click="collapsed = !collapsed"
    :class="{ 'section-title--opened': !collapsed }">
    <i
      v-if="collapsed === true"
      class="fa fa-plus section-title__icon"/>
    <i
      v-if="collapsed === false"
      class="fa fa-minus section-title__icon"/>
    {{ title }}
  </h2>
  <div class="section-content" v-show="!collapsed">
    <div v-for="hotkey in hotkeys" :key="hotkey.resourceId">
      <hotkey :hotkey="hotkey" />
    </div>
  </div>
</div>
</template>

<script lang="ts" src="./HotkeyGroup.vue.ts"></script>
