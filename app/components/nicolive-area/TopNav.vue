<template>
  <div class="top-nav" v-if="hasProgram">
    <div class="tabs">
      <div class="top-nav-item">
        <a @click="fetchProgram" :disabled="isFetching" class="link"><i class="icon-reload"></i>番組再取得</a>
      </div>
      <div class="top-nav-item">
        <a @click="editProgram" :disabled="isEditing" class="link"><i class="icon-edit"></i>番組編集</a>
      </div>
    </div>  
  </div>
</template>

<script lang="ts" src="./TopNav.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/_colors";
@import "../../styles/mixins";

.top-nav {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  font-size: 14px;
  padding: 0 16px;
  position: relative;
  flex: 0 0 38px;
  min-width: 100%;
  background-color: @bg-tertiary;
  i {
    font-size: 14px;
    margin-right: 4px;
    &.icon-dev {
      font-size: 16px;
    }
  }
}
.tabs {
  flex-grow: 1;
  display: flex;
  text-align: left;
  justify-content: flex-start;
  align-items: center;

  .top-nav-item {
    display: flex;
    align-items: center;
    margin-right: 12px;

    &.top-nav-item--active {
      >a {
        >i, >span {
          color: @text-primary;
        }
      }
    }
  }
}
    
</style>
