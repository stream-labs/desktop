<template>
  <div class="program-description">
    <div class="program-description-header">
      <p class="program-description-title">番組詳細</p>
      <div class="color-change-wrapper">
        <span class="color-change-label">背景色</span>　
        <input class="radio-btn" type="radio" id="change-dark-mode-btn" value="dark-mode" v-model="bgColorMode"><label for="change-dark-mode-btn" class="dark-mode-label"></label>
        <input class="radio-btn" type="radio" id="change-light-mode-btn" value="light-mode" v-model="bgColorMode"><label for="change-light-mode-btn" class="light-mode-label"></label>
      </div>
    </div>
    <div @click="handleAnchorClick" :class="bgColorMode" class="program-description-body">
      <div v-html="programDescription" class="program-description-text"></div>
    </div>
  </div>
</template>

<script lang="ts" src="./ProgramDescription.vue.ts"></script>
<style lang="less" scoped>
@import "../../styles/_colors";
@import "../../styles/mixins";

.program-description {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  width: 100%;
}

.program-description-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 40px;
  padding: 0 16px;
  background-color: @bg-quinary;
}

.program-description-title {
  font-size: 12px;
  color: @text-primary;
  margin: 0;
}

.color-change-wrapper {
  display: flex;
  align-items: center;

  .color-change-label {
    font-size: 11px;
    color: @text-secondary;
    margin-right: 12px;
  }

  .radio-btn {
    display: none;

    & + label {
      position: relative;
      width: 16px;
      height: 16px;
      margin: 0;
      border: 1px solid @white;
      border-radius: 100%;

      &:not(:last-child) {
        margin-right: 8px;
      }

      &.dark-mode-label {
        background-color: @bg-secondary; 
      }

      &.light-mode-label {
       background-color: @white;
      } 
    }

    &:checked {
      & + label {
        border-color: @text-active;
      }
    }
  }
}

.program-description-body {
  flex-grow: 1;
  flex-basis: 0;
  overflow-y: auto;
  overflow-x: hidden;

  &.dark-mode {
    background-color: @bg-tertiary;
  }

  &.light-mode {
    background-color: @white;

    &::-webkit-scrollbar-track {
      background-color: transparent;
      border: none;
    }

    &::-webkit-scrollbar-thumb {
      background-color: @grey;
      border-color: @white;
    }
  }
}

.program-description-text {
  padding: 16px;

  .dark-mode & {
    color: @text-secondary;
  }

  .light-mode & {
    color: @black;
  }
}

</style>
