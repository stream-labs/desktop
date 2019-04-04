<template>
  <div class="nicolive-area">
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
</template>

<script lang="ts" src="./NicoliveArea.vue.ts"></script>
