<template>
  <div class="setting-section">
    <div class="section-heading">フィルター設定</div>
    <div class="section-content">
      <div class="section-item">
        <div class="row">
          <div class="name">匿名(184)のコメントを表示</div>
          <div class="value"><input type="checkbox" v-model="showAnonymous" class="toggle-button" /></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./CommentLocalFilter.vue.ts"></script>
<style lang="less" scoped>
@import "../../styles/_colors";
@import "../../styles/mixins";

.setting-section {
  border-bottom: 1px solid @bg-quinary;
}

.section-heading {
  color: @grey;
  padding: 16px 16px 8px;
}

.section-item {
  padding: 16px;
}

.row {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
}

.name {
  font-size: 12px;
  color: @light-grey;
  flex-grow: 1;
}

.value {
  display: flex;
  align-items: center;
}

.nl-select {
  font-size: 12px;
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
