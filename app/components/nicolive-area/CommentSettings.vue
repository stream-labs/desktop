<template>
  <div class="container">
    <div class="header">
      <p class="header-title">コメント設定</p>
      <i class="icon-close icon-btn" @click="close"></i>
    </div>
    <div class="content">
      <comment-local-filter />
      <comment-synthesizer />
    </div>
  </div>
</template>

<script lang="ts" src="./CommentSettings.vue.ts"></script>
<style lang="less" scoped>
@import "../../styles/index";

.container {
  display: flex;
  flex-direction: column;
  width: 100%;
  flex-grow: 1;
  flex-basis: 0;
  overflow-y: auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 48px;
  padding: 4px 16px;
  border-bottom: 1px solid var(--color-border-light);

  > .header-title {
    font-size: @font-size4;
    color: var(--color-text-light);
    text-align: center;
    margin: 0;
  }

  > .icon-close {
    display: flex;
    align-items: center;
    position: absolute;
    right: 16px;
  }
}

.content {
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.row {
  width: 100%;
  padding: 16px;

  display: flex;
  flex-direction: row;
  align-items: center;
}

.name {
  font-size: @font-size4;
  color: var(--color-text);
  flex-grow: 1;
}

.value {
  display: flex;
  align-items: center;
}

.nl-select {
  font-size: @font-size2;
  color: @white;
  min-width: 80px;
  height: 32px;
  line-height: 32px;
  margin: 0;
  padding: 0 24px 0 8px;
  background-color: @bg-primary;
  border-color: transparent;
  outline: none;
  cursor: pointer;

  &:focus {
    border: 1px solid @text-primary;
  }
}
</style>
