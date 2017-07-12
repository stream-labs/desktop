<template>
<div>
  <div
    class="widget"
    :class="{ selected }"
    @click="$emit('inspect')">
    <div class="widget__icon">
      <slot name="icon"></slot>
    </div>
    <div class="widget__info">
      <div class="widget__name">{{ name }}</div>
      <div class="widget__desc">
        {{ description }}
      </div>
    </div>
  </div>
  <div
    class="widget-detail-wrapper"
    v-if="inspected"
    @click="$emit('close')">
    <div class="widget-detail" @click.stop="() => {}">
      <div class="widget-detail__header">
        <div class="flex flex--center">
          <div class="widget__icon">
            <slot name="icon"></slot>
          </div>
          <div class="widget__info">
            <div class="widget__name">{{ name }}</div>
            <div class="widget__desc">
              {{ description }}
            </div>
          </div>
        </div>
        <div class="flex flex--center">
          <button
            class="button button--semi-opac"
            @click="$emit('toggle')">
            {{ buttonTextForWidget() }}
          </button>
          <div
            class="widget-detail-close"
            @click="$emit('close')">
            <i class="fa fa-times" />
          </div>
        </div>
      </div>
      <div class="widget-detail__body">
        <slot name="body"></slot>
      </div>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

@Component({})
export default class SelectableWidget extends Vue {

  @Prop()
  selected: boolean;

  @Prop()
  inspected: boolean;

  @Prop()
  name: string;

  @Prop()
  description: string;

  buttonTextForWidget() {
    return this.selected ? 'Remove Widget' : 'Add Widget';
  }

}
</script>

<style lang="less" scoped>
@import "../../../styles/index";

.widget {
  margin-top: 20px;
  border: 2px solid transparent;
  .radius;
  background: @night-select-bg;
  padding: 20px;
  width: 200px;
  text-align: left;
  display: flex;
  cursor: pointer;
  width: 360px;
  .transition;

  &:hover {
    border-color: @teal-light-opac;
  }

  &.selected {
    border-color: @teal-bright;
  }
}

.widget__icon {
  width: 40px;
  margin-right: 20px;
}

.widget__info {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: left;
}

.widget__name {
  .semibold;
  color: @white;
  font-size: 14px;
}

.widget__desc {
  color: @grey;
}

.widget-detail-wrapper {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  background: rgba(43,56,63, .85);
  display: flex;
  justify-content: center;
  align-items: center;
}

.widget-detail {
  .radius;
  background: @night-select-bg;
  overflow: hidden;
  width: 80%;
  min-width: 550px;
  max-width: 750px;
}

.widget-detail-close {
  color: @grey;
  .transition;
  margin-left: 20px;
  cursor: pointer;

  &:hover {
    color: @white;
  }
}

.widget-detail__header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
}

.widget-detail__body {
  overflow: hidden;

  video {
    width: 102%;
    display: flex;
    margin: -3px -1% -1px -1%;
  }
}
</style>
