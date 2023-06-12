<template>
  <modal-layout :showControls="false">
    <div slot="content">
      <div>
        <img :src="userIconURL" width="32" height="32" />
        <div>{{ userName }}</div>
        <div>ID:{{ userId }}</div>
        <div v-if="isPremium">プレミアム会員</div>
        <div v-else>一般会員</div>
        <div>
          <button class="button button-secondary" v-if="isFollowing" @click.stop="unFollowUser">
            ✓フォロー中
          </button>
          <button class="button button--primary" v-else @click.stop="followUser">★フォロー</button>
        </div>
      </div>
      <div>
        <div>好きなものリスト({{ konomiTags.length }}個)</div>
        <div
          v-for="tag in konomiTags.slice(0, 20)"
          :key="tag.name"
          :class="{ tagname: true, common: tag.common }"
        >
          {{ tag.name }}
        </div>
      </div>
      <div>
        <div>直近のコメント一覧</div>
        <div class="content">
          <div class="list" ref="scroll">
            <component
              :class="{ row: true, name: item.value.name }"
              v-for="item of comments"
              :key="item.seqId"
              :is="componentMap[item.component]"
              :chat="item"
              :getFormattedLiveTime="getFormattedLiveTime"
            />
          </div>
        </div>
      </div>
    </div>
  </modal-layout>
</template>

<script lang="ts" src="./UserInfo.vue.ts"></script>

<style lang="less" scoped>
@import url('../../styles/index');

.tagname {
  display: inline-block;
  padding: 2px;
  margin: 2px;
  border: 1px solid #ccc;
  border-radius: 4px;

  &.common {
    color: black;
    background-color: #ccc;
  }
}

// 以下は CommentViewer.vue からコピー
.content {
  position: relative;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.list {
  flex-grow: 1;
  // height: 0; // 100%がなぜか動かなくなったので workaround (Electron 6.1.11)
  padding-top: 8px;
  overflow-x: hidden;
  overflow-y: auto;
}

.row {
  width: 100%;
  height: 32px;
  font-size: @font-size2;
  line-height: 32px;

  &.name {
    height: 64px;
  }
}
</style>
