<template>
<div class="input-container">
  <div class="input-label">
    <label>
      {{ value.description }}
    </label>
  </div>
  <div class="input-wrapper editable-list">
    <div class="editable-list__bar">
      <i
        @click="menu.popup()"
        class="fa fa-plus icon-btn editable-list__control"/>
      <i
        @click="handleRemove"
        class="fa fa-minus icon-btn editable-list__control"/>
      <i
        @click="handleEdit"
        class="fa fa-cog icon-btn editable-list__control"/>
    </div>
    <selector
      class="editable-list__list"
      :items="list"
      :activeItem="activeItem"
      @select="handleSelect"
      @sort="handleSort"/>
  </div>
</div>
</template>

<script lang="ts" src="./EditableListInput.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";

.editable-list__list {
  background: @day-input-bg;
  border: 1px solid @day-input-border;
}

.editable-list__bar {
  display: flex;
  flex-direction: row;
  margin-bottom: 10px;
}

.night-theme {
  .editable-list__list {
    border-color: @night-secondary;
    background: @night-secondary;
  }
}
</style>
