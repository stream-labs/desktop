<template>
  <div class="help-tip" v-if="shouldShow">
    <div class="help-tip__arrow"></div>
    <i @click="closeHelpTip" class="help-tip__close icon-close" />
    <div class="help-tip__title">
      <i class="fa fa-info-circle" />
      <slot name="title"></slot>
    </div>
    <div class="help-tip__body"><slot name="content"></slot>
    </div>
  </div>
</template>

<script lang="ts" src="./HelpTip.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.help-tip {
  position: absolute;
  background: var(--teal);
  .radius();
  color: var(--white);
  top: -8px;
  right: 102px;
  width: 260px;
  padding: 10px;
  font-size: 14px;
  animation: bounce 18s ease-in-out 2s 3 both;
}

.help-tip__arrow {
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 8px 8px 8px 0;
  border-color: transparent @teal transparent transparent;
  position: absolute;
  left: -8px;
}

.help-tip__close {
  position: absolute;
  right: 10px;
  cursor: pointer;
  opacity: .6;
  .transition();

  &:hover {
    opacity: 1;
  }
}

.help-tip__title {
  .weight(@medium);
  font-size: 16px;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,.2);

  .fa {
    margin-right: 8px;
    font-size: 16px;
  }
}

@keyframes bounce {
   from, 3%, 6%, 10%, to {
    animation-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
    transform: translateX(0);
  }

  4%, 5% {
    animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
    transform: translateX(30px);
  }

  8% {
    animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
    transform: translateX(15px);
  }

  11% {
    transform: translateX(4px);
  }

  12% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(0);
  }
}
</style>
