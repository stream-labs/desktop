<template>
  <div>
    <div class="source-info">
      <div class="source-info__media">
        <slot name="media"></slot>
      </div>

      <div class="source-info__text">
        <h3>{{ $t(`source-props.${sourceType}.name`) }}</h3>
        <div class="desc">{{ $t(`source-props.${sourceType}.description`) }}</div>
        <p class="attention" v-if="showAttention">
          <slot name="attention-text"></slot>
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./AddSourceInfo.vue.ts"></script>

<style lang="less" scoped>
@import url('../../styles/index');

.source-info--no-selection {
  ol {
    margin-left: 12px;

    li {
      margin-bottom: 8px;
    }
  }
}

.source-info__media {
  display: flex;
  flex: 1;
  align-content: center;
  align-items: center;
  justify-content: center;
  max-height: 150px;
  color: var(--color-text);
  text-align: center;
}

.source-info__text {
  flex: 2;

  h3,
  .desc {
    margin-bottom: 12px;
  }
}

.source-support__list {
  display: flex;
  flex: 250px;
  flex-direction: column;
  flex-wrap: wrap;
  height: 64px;
  margin-bottom: 0;
  margin-left: 15px;

  li {
    padding-right: 50px;
  }
}

.source-support__label {
  margin-bottom: 5px;
  font-size: 11px;
  letter-spacing: 0.7px;
  .semibold;
}

.source-info__body {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
</style>
