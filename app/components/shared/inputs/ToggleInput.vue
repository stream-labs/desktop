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
  margin: 0 2px;
  position: relative;
  width: 24px;
  height: 16px;
  .cursor--pointer();
}
.toggleinput__track {
  .transition;
  background-color: @light-3;
  border-radius: 20px;
  width: 100%;
  height: 100%;
}

.toggleinput__handle {
  .transition();
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  background-color: @white;

}
.night-theme {
  .toggleinput__track {
    .transition;
    background-color: @dark-5;
    border-radius: 20px;
    width: 100%;
    height: 100%;
  }
}

.toggleinput__container--active {
  .toggleinput__handle {
    transform: translateX(8px);
  }

  .toggleinput__track {
    background-color: @teal;
  }
}


</style>
