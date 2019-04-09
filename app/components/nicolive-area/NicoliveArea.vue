<template>
  <div class="root">
    <button @click="onToggle" class="nicolive-area-toggle-button" :class="{ 'nicolive-area--opened': opened }">
    </button>
    <div class="nicolive-area" v-if="opened">
      <top-nav />
      <template v-if="hasProgram">
        <program-info />
        <tool-bar />
        <program-statistics />
        <program-description />
        <comment-form />
      </template>
      <template v-else>
        <div><button @click="createProgram" :disabled="isCreating">番組作成</button></div>
        <div><button @click="fetchProgram" :disabled="isFetching">番組取得</button></div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" src="./NicoliveArea.vue.ts"></script>

<style lang="less" scoped>
.root {
  display: flex;
  height: 100%;
}

.nicolive-area-toggle-button {
  display: block;
  height: 100%;
  width: 8px;
  // debug
  background-color: white;
}

.nicolive-area {
  flex-basis: fill;
  width: 360px;
}
</style>
