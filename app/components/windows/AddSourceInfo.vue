<template>
  <div>
    <div class="source-info" :data-type="sourceType">
      <div class="source-info__text">
        <h3><slot name="media"></slot>{{ $t(`source-props.${sourceType}.name`) }}</h3>
        <div class="desc">{{ $t(`source-props.${sourceType}.description`) }}</div>
        <p class="attention" v-if="showAttention">
          <slot name="attention-text"></slot>
        </p>
      </div>
      <div class="source-info__media">
        <slot name="media"></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./AddSourceInfo.vue.ts"></script>

<style lang="less" scoped>
@import url('../../styles/index');

.source-info {
  &::after {
    position: absolute;
    content: '';
    background-size: cover;
  }

  &[data-type='near'] {
    background: linear-gradient(90deg, #527e80 0%, #93b5b8 100%);

    &::after {
      top: -59px;
      right: -66px;
      width: 646px;
      height: 646px;
      background-image: url('../../../media/images/nvoice.png');
    }
  }

  &[data-type='custom_cast_ndi_guide'],
  &[data-type='custom_cast_ndi_source'] {
    background: linear-gradient(90deg, #0264c8 0%, #5aa1ea 66.15%, #add5ff 100%);

    &::after {
      top: -67px;
      right: -141px;
      width: 412px;
      height: 845px;
      background-image: url('../../../media/images/custom-cast-image.png');
    }
  }
}

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
  align-content: center;
  align-items: center;
  justify-content: center;
  margin: 0 8px 0 auto;
  text-align: center;

  svg {
    width: 120px;
    height: 120px;
    color: var(--color-text-dark);
  }

  [data-type='near'] &,
  [data-type='custom_cast_ndi_guide'] &,
  [data-type='custom_cast_ndi_source'] & {
    display: none;
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

.attention {
  margin: 0;
}
</style>
