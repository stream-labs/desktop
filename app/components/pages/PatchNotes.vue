<template>
<div class="patch-notes-page">
  <div class="patch-notes-container">
    <div class="patch-notes-header">
      <div class="patch-notes-title">
        {{ notes.title }}
      </div>
      <div class="patch-notes-version">
        v{{ notes.version }}
      </div>
    </div>
    <ul class="patch-notes-list">
      <li
        class="patch-notes-item"
        v-for="(item, index) in notes.notes"
        :key="index">
        {{ item }}
      </li>
    </ul>
    <button
      @click="done"
      class="patch-notes-button button button--action">
      Continue
    </button>
  </div>
</div>
</template>

<script lang="ts" src="./PatchNotes.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.patch-notes-page {
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.patch-notes-container {
  width: 400px;
  overflow: auto;
}

.patch-notes-header {
  display: flex;
  font-size: 22px;
  font-weight: 400;
  letter-spacing: 0.5px;
}

.patch-notes-title {
  flex-grow: 1;
  color: @black;
}

.patch-notes-version {
  color: @grey;
}

.patch-notes-list {
  margin-top: 20px;
  margin-bottom: 30px;
}

.patch-notes-button {
  width: 100%;
}

.night-theme {
  .patch-notes-title {
    color: @white;
  }
}
</style>
