<template>
  <div>
    <div @click="updateValue" class="media-box radius">
      <div class="footer">
        <span>Default</span>
        <span>Change Media</span>
        <span>Toolbar</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./WMediaGalleryInput.vue.ts"></script>

<style lang="less">
@import "../../../styles/index";

.media-box {
  position: relative;
  width: 100%;
  height: 120px;
  background-color: @day-secondary;
  border: 1px solid @day-secondary;
}

.footer {
  display: flex;
  position: absolute;
  bottom: 0;
  justify-content: space-between;
}

.night-theme {
  .media-box {
    background-color: @night-secondary;
    border-color: @night-secondary;
  }
}
</style>
