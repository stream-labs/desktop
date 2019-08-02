<template>
<div class="container">
  <div
    v-for="option in metadata.options"
    :key="option.value"
    class="image-container radius"
    :class="[value === option.value ? 'active' : '']"
    @click="emitInput(option.value)"
  >
    <img :src="option.description" >
  </div>
</div>
</template>

<script lang="ts" src="./ImagePickerInput.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";

.container {
  width: 370px;
  display: flex;
  flex-wrap: wrap;
}

.image-container {
  width: 80px;
  height: 80px;
  border: 1px solid @day-input-border;
  margin: 2px;
  .transition();
  position: relative;
  .radius();

  &:hover {
    border-color: @teal-light-opac;
    cursor: pointer;
  }

  img {
    height: 70px;
    width: auto;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  &.active {
    background-color: @teal-light-opac;
    border-color: @teal-med-opac;
  }
}

.night-theme {
  .image-container {
    border-color: @night-border;

    &:hover {
      border-color: @teal-light-opac;
    }
    &.active {
      border-color: @teal-med-opac;
    }
  }
}
</style>
