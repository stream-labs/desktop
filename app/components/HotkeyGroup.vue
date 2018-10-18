<template>
<div class="section">
  <h2
    class="section-title section-title--dropdown"
    v-if="title"
    @click="collapsed = !collapsed">
    <i
      v-if="collapsed === true"
      class="fa fa-plus section-title__icon"/>
    <i
      v-if="collapsed === false"
      class="fa fa-minus section-title__icon"/>
    {{ title }}
  </h2>
  <transition name="expand">
    <div
      class="section-content"
      v-show="!collapsed"
      :class="{ 'section-content--opened': title }">
      <div v-for="hotkey in hotkeys" :key="hotkey.resourceId">
        <hotkey :hotkey="hotkey" />
      </div>
    </div>
  </transition>
</div>
</template>

<script lang="ts" src="./HotkeyGroup.vue.ts"></script>
