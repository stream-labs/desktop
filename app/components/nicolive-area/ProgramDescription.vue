<template>
  <div>
    <h1>番組詳細</h1>
    <input type="checkbox" v-model="lightMode" />
    <div :class="{ 'light-mode': lightMode }" @click="handleAnchorClick" v-html="programDescription"></div>
  </div>
</template>

<script lang="ts" src="./ProgramDescription.vue.ts"></script>

