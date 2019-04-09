<template>
  <div class="root">
    <button @click="onToggle" class="nicolive-area-toggle-button" :class="{ 'nicolive-area--opened': opened }">
      <ControlsArrow />
    </button>
    <div class="nicolive-area-container" v-if="opened">
      <top-nav />
      <template v-if="hasProgram">
        <program-info />
        <tool-bar />
        <program-statistics />
        <program-description />
        <comment-form />
      </template>
      <template v-else>
        <div><button @click="createProgram" :disabled="isCreating">番組作成</button></div>
        <div><button @click="fetchProgram" :disabled="isFetching">番組取得</button></div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" src="./NicoliveArea.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/_colors";
@import "../../styles/mixins";

.root {
  display: flex;
  height: 100%;
  border-left: 1px solid @bg-secondary;
}

.nicolive-area-toggle-button {
  width: 16px;
  height: 180px;
  margin: auto 8px auto auto;
  background-color: @bg-primary;
  border-width: 1px 1px 1px 0;
  border-style: solid;
  border-color: @bg-secondary;

  > svg {
    width: 10px;
    height: 140px;
    fill: @bg-secondary;
    transition: .5s;
    transform: rotate(180deg);
  }

  &:hover {
    background-color: @bg-secondary;

    > svg {
      fill: @text-primary;
    }
  }

  &.nicolive-area--opened {
    > svg {
      transform: rotate(0deg);
    }
  }
}

.nicolive-area-container {
  width: 400px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  align-items: center;
  background-color: @bg-primary;
}
</style>
