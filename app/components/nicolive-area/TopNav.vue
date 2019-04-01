<template>
  <div>
    <div v-if="hasProgram">
      <button @click="fetchProgram" :disabled="isFetching">番組取得</button>
      <button @click="editProgram" :disabled="isEditing">番組編集</button>
      <a @click.prevent="openInDefaultBrowser($event)" :href="twitterShareURL">share in twitter</a>
      <a @click.prevent="openInDefaultBrowser($event)" :href="contentTreeURL">コンテンツツリー</a>
      <a @click.prevent="openInDefaultBrowser($event)" :href="creatorsProgramURL">クリエイター奨励プログラム</a>
    </div>
  </div>
</template>

<script lang="ts" src="./TopNav.vue.ts"></script>
