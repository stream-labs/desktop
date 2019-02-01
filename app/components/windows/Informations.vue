<template>
<modal-layout title="お知らせ" :showControls="false">

  <div slot="content" data-test="Informations">
    <ul v-if="!fetching && !hasError">
      <li v-for="(information, index) in informations" :key="index">
        <span><template v-if="shouldShowNewLabel(information.date)">New!!</template></span>
        <time>{{format(information.date)}}</time>
        <a :href="information.url" @click="handleAnchorClick($event)">{{information.title}}</a>
      </li>
    </ul>
    <div v-else-if="fetching">
      <p>fetching...</p>
    </div>
    <div v-else-if="hasError">
      <i>
        <!-- TODO: アイコン -->
        error
      </i>
      <h2>ニコニコインフォ一覧の取得に失敗しました</h2>
      <p>
        オフラインになっている可能性があります。
        <br />
        ネットワークが正しく接続されているかを確認してください。
      </p>
      <p>※N Airに関するニコニコインフォ一覧をWebブラウザで表示する場合は<a href="http://blog.nicovideo.jp/niconews/category/se_n-air/" @click="handleAnchorClick($event)">こちら</a></p>
    </div>
  </div>

</modal-layout>
</template>

<script lang="ts" src="./Informations.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";



</style>
