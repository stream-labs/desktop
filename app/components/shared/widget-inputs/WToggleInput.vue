<template>
<div
  @click="handleClick"
  class="wtoggleinput__container"
  :class="{'wtoggleinput__container--active' : value}"
>
  <div
    class="wtoggleinput__track"
    :class="{'wtoggleinput__track--active' : value}"
  ></div>
  <div
    class="wtoggleinput__handle"
    :class="{'wtoggleinput__handle--active' : value}"
  ></div>
</div>
</template>

<script lang="ts" src="./WToggleInput.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";

.wtoggleinput__container {
  padding: 5px;
  position: relative;
  width: 44px;
  height: 22px;
  .cursor--pointer();
}
.wtoggleinput__track {
  .transition;
  background-color: @grey;
  border-radius: 30px;
  width: 100%;
  height: 100%;
}

.wtoggleinput__handle {
  .transition();
  position: absolute;
  z-index: 2;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  top: 0;
  left: 0;
  box-shadow: 0 2px 6px 0 rgba(0,0,0,0.76);
  background-color: #37474f;

  &:hover {
    background-color: #303f47;
  }

}

.wtoggleinput__container--active {
  .wtoggleinput__handle {
    transform: translateX(22px);
  }

  .wtoggleinput__track {
    background-color: @teal;
  }
}



</style>
