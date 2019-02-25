<template>
<modal-layout title="お知らせ" :showControls="false">

  <div class="informations" slot="content" data-test="Informations">
    <ul class="information-list" v-if="!fetching && !hasError">
      <li class="information-list-item" v-for="(information, index) in informations" :key="index">
        <a class="information-link" :href="information.url" @click="handleAnchorClick($event)">
          <span class="information-label-new"><template v-if="shouldShowNewLabel(information.date)">NEW</template></span>
          <time class="information-date">{{format(information.date)}}</time>
          <p class="information-title">{{information.title}}</p>
        </a>
      </li>
    </ul>
    <div v-else-if="fetching">
      <p>fetching...</p>
    </div>
    <div class="information-error" v-else-if="hasError">
      <i class="icon-warning"></i>
      <h2 class="error-title">ニコニコインフォ一覧の取得に失敗しました</h2>
      <p class="error-text">
        オフラインになっている可能性があります。
        <br />
        ネットワークが正しく接続されているかを確認してください。
      </p>
      <p class="error-attention">※N Airに関するニコニコインフォ一覧をWebブラウザで表示する場合は<a href="http://blog.nicovideo.jp/niconews/category/se_n-air/" @click="handleAnchorClick($event)">こちら</a></p>
    </div>
  </div>

</modal-layout>
</template>

<script lang="ts" src="./Informations.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.informations {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.information-list {
  margin: -16px;
  list-style: none;
}

.information-list-item {
  &:not(:last-child) {
    border-bottom: 1px solid @border;
  }
}

.information-link {
  display: flex;
  padding: 16px 40px 16px 16px;
  align-items: center;
  text-decoration: none;
  position: relative;

  &:after {
    border-style: solid;
    border-color: @text-secondary;
    border-width: 1px 1px 0 0;
    content: "";
    display: block;
    width: 8px;
    height: 8px;
    position: absolute;
    top: 50%;
    right: 16px;
    transform: rotate(45deg) translateY(-50%);
  }

  &:hover {
    background-color: @bg-secondary;

    &:after {
      border-color: @text-primary;
    }
  }
}

.information-label-new {
  color: @white;
  background-color: @accent-hover;
  font-size: 10px;
  font-weight: bold;
  text-align: center;
  line-height: 16px;
  flex-basis: 32px;
  flex-shrink: 0;
}

.information-date {
  color: @grey;
  margin-left: 16px;
  white-space: nowrap;
}

.information-title {
  color: @white;
  margin: 0;
  text-decoration: none;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  margin-left: 16px;
}

.information-error {
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.icon-warning {
  font-size: 70px;
  color: @bg-primary;
  margin-bottom: 16px;
}

.error-title {
  color: @white;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
}

.error-text {
  color: @grey;
  text-align: center;
}

.error-attention {
  color: @grey;
  font-size: 12px;
  margin-bottom: 0;
}

</style>
