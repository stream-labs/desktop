<template>
  <div>
    <div v-if="hasProgram">
      <button @click="fetchProgram" :disabled="isFetching">番組取得</button>
      <button @click="editProgram" :disabled="isEditing">番組編集</button>
    </div>
  </div>
</template>

<script lang="ts" src="./TopNav.vue.ts"></script>
