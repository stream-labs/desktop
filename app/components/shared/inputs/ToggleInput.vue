<template>
<div
  @click="handleClick"
  class="toggleinput__container"
  :class="{'toggleinput__container--active' : value}"
>
  <div
    class="toggleinput__track"
    :class="{'toggleinput__track--active' : value}"
  ></div>
  <div
    class="toggleinput__handle"
    :class="{'toggleinput__handle--active' : value}"
  ></div>
</div>
</template>

<script lang="ts" src="./ToggleInput.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";

.toggleinput__container {
  padding: 5px;
  margin: 0 2px;
  position: relative;
  width: 40px;
  height: 18px;
  .cursor--pointer();
}
.toggleinput__track {
  .transition;
  background-color: @grey;
  border-radius: 30px;
  width: 100%;
  height: 100%;
}

.toggleinput__handle {
  .transition();
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  top: 0;
  left: 0;
  box-shadow: 0 2px 6px 0 rgba(0,0,0,0.76);
  background-color: #37474f;

  &:hover {
    background-color: #303f47;
  }

}

.toggleinput__container--active {
  .toggleinput__handle {
    transform: translateX(20px);
  }

  .toggleinput__track {
    background-color: @teal;
  }
}



</style>
