<template>
<modal-layout :title="$t('informations.title')" :showControls="false">

  <div class="informations" slot="content" data-test="Informations">
    <ul class="information-list" v-if="!fetching && !hasError">
      <li class="information-list-item" v-for="(information, index) in informations" :key="index">
        <a class="information-link" :href="information.url" @click="handleAnchorClick($event)">
          <span class="information-label-new"><template v-if="shouldShowNewLabel(information.date)">NEW</template></span>
          <time class="information-date">{{format(information.date)}}</time>
          <p class="information-title">{{information.title}}</p>
        </a>
      </li>
    </ul>
    <div v-else-if="fetching">
      <p>fetching...</p>
    </div>
    <div class="information-error" v-else-if="hasError">
      <i class="icon-warning"></i>
      <h2 class="error-title">{{ $t("informations.errorHeading") }}</h2>
      <p class="error-text">
        {{ $t("informations.errorDescription") }}
      </p>
      <i18n class="error-attention" path="informations.errorAttention" tag="p">
        <a place="link" href="https://blog.nicovideo.jp/niconews/category/se_n-air/" @click="handleAnchorClick($event)">
          {{ $t("informations.errorAttentionLink") }}
        </a>
      </i18n>
    </div>
  </div>

</modal-layout>
</template>

<script lang="ts" src="./Informations.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/_colors";

.informations {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.information-list {
  margin: -16px;
  list-style: none;
}

.information-list-item {
  border-bottom: 1px solid @border;
}

.information-link {
  display: flex;
  align-items: center;
  padding: 16px 40px 16px 16px;
  text-decoration: none;
  position: relative;

  &:after {
    border-style: solid;
    border-color: @text-secondary;
    border-width: 1px 1px 0 0;
    content: "";
    display: block;
    width: 8px;
    height: 8px;
    position: absolute;
    top: 50%;
    right: 16px;
    transform: rotate(45deg) translateY(-50%);
  }

  &:hover {
    background-color: @bg-secondary;

    &:after {
      border-color: @text-primary;
    }
  }
}

.information-label-new {
  color: @white;
  background-color: @accent-hover;
  font-size: 10px;
  font-weight: bold;
  text-align: center;
  line-height: 16px;
  flex-basis: 32px;
  flex-shrink: 0;
}

.information-date {
  color: @grey;
  margin-left: 16px;
  white-space: nowrap;
}

.information-title {
  color: @white;
  margin: 0;
  text-decoration: none;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  margin-left: 16px;
}

.information-error {
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.icon-warning {
  color: @bg-primary;
  font-size: 70px;
  margin-bottom: 16px;
}

.error-title {
  color: @white;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
}

.error-text {
  color: @grey;
  text-align: center;
}

.error-attention {
  color: @grey;
  font-size: 12px;
  margin-bottom: 0;
}

</style>
