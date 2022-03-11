<template>
  <div class="program-statistics">
    <ul class="program-statistics-list">
      <li class="program-statistics-item" v-tooltip.bottom="visitorTooltip">
        <i class="program-statistics-icon icon-visitor"></i
        ><span class="program-statistics-value">{{ viewers }}</span>
      </li>
      <li class="program-statistics-item" v-tooltip.bottom="commentTooltip">
        <i class="program-statistics-icon icon-comment"></i
        ><span class="program-statistics-value">{{ comments }}</span>
      </li>
      <li class="program-statistics-item" v-tooltip.bottom="adPointTooltip">
        <i class="program-statistics-icon icon-nicoad"></i
        ><span class="program-statistics-value">{{ adPoint }}</span>
      </li>
      <li class="program-statistics-item" v-tooltip.bottom="giftPointTooltip">
        <i class="program-statistics-icon icon-gift"></i
        ><span class="program-statistics-value">{{ giftPoint }}</span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" src="./ProgramStatistics.vue.ts"></script>
<style lang="less" scoped>
@import '../../styles/index';

.program-statistics {
  display: flex;
  height: 32px;
  padding: 0 16px;
  border-top: 1px solid var(--color-border-light);
}

.program-statistics-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  list-style: none;
  margin: 0;
  justify-content: space-between;
  flex-grow: 1;
}

.program-statistics-item {
  display: flex;
  align-items: center;
  flex-grow: 1;

  &:not(:last-child) {
    margin-right: 16px;
  }
}

.program-statistics-icon {
  font-size: @font-size2;
  margin-right: 8px;
  color: var(--color-text-dark);
}

.program-statistics-value {
  font-size: @font-size2;
  flex-grow: 1;
  text-align: center;
  color: var(--color-text);
}
</style>
