<template>
  <div>
    <div class="media-box radius">
      <div class="footer">
        <span>Default</span>
        <div>
          <span @click="updateValue" class="change-media">Change Media</span>
          <i class="icon-link" />
          <i class="fa fa-search-plus" />
          <i class="icon-close" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./WMediaGalleryInput.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";

.media-box {
  position: relative;
  width: 100%;
  height: 120px;
  background-color: @day-secondary;
}

.footer {
  display: flex;
  position: absolute;
  width: auto;
  bottom: 1px;
  left: 1px;
  right: 1px;
  height: 30px;
  justify-content: space-between;
  background: linear-gradient(rgba(0, 0, 0, 0), @night-accent-dark 40%);
  border-radius: 0 0 3px 3px;

  span, i {
    position: relative;
    top: -12px;
  }

  i {
    margin-left: 10px;

    &:hover {
      cursor: pointer;
    }
  }

  .icon-close {
    color: @red;
  }
}

.change-media {
  text-transform: uppercase;
  color: @night-text;

  &:hover {
    cursor: pointer;
  }
}

.night-theme {
  .media-box {
    background-color: @night-secondary;
    border-color: @night-secondary;
  }
}
</style>
