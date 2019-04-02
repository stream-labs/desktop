<template>
  <div>
    <span class="status-indicator" :class="{ 'is-live': programStatus === 'onAir' }">LIVE</span>
    <span><time>{{ format(programCurrentTime) }}</time> / <time>{{ format(programTotalTime) }}</time></span>
    <button @click="extendProgram" :disabled="autoExtensionEnabled || isExtending || !isProgramExtendable">
      30分延長
    </button>
    <div v-if="programStatus === 'reserved'">
      番組開始まで {{ format(-programCurrentTime) }}
    </div>
    <span>自動延長 <input type="checkbox" :checked="autoExtensionEnabled" @click="toggleAutoExtension" /></span>
  </div>
</template>

<script lang="ts" src="./ToolBar.vue.ts"></script>
