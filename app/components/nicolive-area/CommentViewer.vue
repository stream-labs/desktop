<template>
  <div class="container">
    <div class="header">
      <i class="icon-reload icon-btn" v-tooltip.bottom="commentReloadTooltip" @click="refreshConnection"></i>
      <i class="icon-ng icon-btn" v-tooltip.bottom="filterTooltip" @click="isFilterOpened = true"></i>
      <i class="icon-settings icon-btn" v-tooltip.bottom="localFilterTooltip" @click="isLocalFilterOpened = true"></i>
    </div>
    <div class="content">
      <div class="list" ref="scroll">
        <component
          class="row"
          v-for="item of items"
          :key="item.seqId"
          :is="componentMap[item.type]"
          :chat="item"
          :getFormattedLiveTime="getFormattedLiveTime"
          :commentMenuOpened="commentMenuTarget === item"
          @pinned="pin(item)"
          @commentMenu="showCommentMenu(item)"
        />
        <div class="sentinel" ref="sentinel"></div>
      </div>
      <div class="pinned" v-if="Boolean(pinnedComment)">
        <div class="comment-number">{{ pinnedComment.value.no }}</div>
        <div class="comment-body">
          {{ pinnedItemComtent(pinnedComment) }}
        </div>
        <div class="close"><i class="icon-close icon-btn" @click="pin(null)"></i></div>
      </div>
      <button type="button" @click="scrollToLatest" class="scroll-to-latest" v-if="!isLatestVisible && items.length > 0">最新のコメントへ移動<i class="icon-down-arrow"></i></button>
    </div>
    <comment-form class="comment-form" />
    <comment-filter class="overlay" @close="isFilterOpened = false" v-if="isFilterOpened"/>
    <comment-local-filter class="overlay" @close="isLocalFilterOpened = false" v-if="isLocalFilterOpened" />
  </div>
</template>

<script lang="ts" src="./CommentViewer.vue.ts"></script>
<style lang="less" scoped>
@import "../../styles/_colors";
@import "../../styles/mixins";

.container {
  width: 100%;
  flex-grow: 1;

  display: flex;
}

.header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  width: 100%;
  height: 48px;
  padding: 4px 16px;
  background-color: @bg-secondary;
  border-bottom: 1px solid @bg-primary;

  > .icon-btn {
     margin-left: 16px;

    &:first-child {
      margin-left: auto;
    }
  }
}

.content {
  flex-grow: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: @bg-secondary;
}

.list {
  flex-grow: 1;
  overflow-y: auto;
  padding-top: 8px;
}

.row {
  font-size: 12px;
  height: 32px;
  line-height: 32px;
  width: 100%;
}

.sentinel {
  pointer-events: none;
  height: 4px;
  margin-top: -4px;
}

.pinned {
  font-size: 12px;
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  border: 1px solid @text-secondary;
  background-color: rgba(@border, .9);
  border-radius: 4px;
  display: flex;
  padding: 12px 16px;

  & > .comment-number {
    color: @light-grey;
    flex-shrink: 0;
  }

  & > .comment-body {
    color: @white;
    margin-left: 16px;
    flex-grow: 1;
    word-break: break-word;
  }

  & > .close {
    height: 18px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    margin-left: 16px;

    & > .icon-btn {
      margin: 0;
      font-size: 10px;
    }
  }
}

.scroll-to-latest {
  display: flex;
  align-items: center;
  font-size: 12px;
  transform: translateX(-50%);
  position: absolute;
  left: 50%;
  bottom: 16px;
  height: 32px;
  line-height: 32px;
  padding: 0 16px;
  text-align: center;
  background-color: @text-secondary;
  color: @white;
  border-radius: 16px;
  box-shadow: 0 0 4px rgba(@black, .5);
  cursor: pointer;

  > i {
    font-size: 10px;
    margin-left: 8px;
  }
}

.comment-form {
  flex-shrink: 0;
}

.overlay {
  z-index: 2; // AreaSwitcherのheaderより大きく
  position: absolute;
  height: 100%;
  background-color: @bg-primary;
}
</style>
