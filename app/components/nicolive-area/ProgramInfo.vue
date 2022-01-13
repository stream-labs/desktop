<template>
  <div class="program-info">
    <div class="community-icon" :class="{ 'is-onAir': isOnAir }">
      <img :src="communitySymbol" class="community-thumbnail" :alt="communityName" />
    </div>
    <div class="program-info-description">
      <h1 class="program-title">
        <a
          :href="watchPageURL"
          @click.prevent="openInDefaultBrowser($event)"
          class="program-title-link link"
          v-tooltip.bottom="programTitle"
        >
          {{ programTitle }}
        </a>
      </h1>
      <h2 class="community-name">
        <i
          v-if="programIsMemberOnly"
          class="icon-lock"
          v-tooltip.bottom="programIsMemberOnlyTooltip"
        ></i>
        <a
          :href="communityPageURL"
          @click.prevent="openInDefaultBrowser($event)"
          class="community-name-link link"
          v-tooltip.bottom="communityName"
        >
          {{ communityName }}
        </a>
      </h2>
    </div>
    <popper 
      trigger="click"
      :options="{ placement: 'bottom-end' }"
      @show="showPopupMenu = true"
      @hide="showPopupMenu = false"
    >
      <div class="popper">
        <div class="popup-menu-head">{{ programTitle }}</div>
        <ul class="popup-menu-list">
          <li class="popup-menu-item"><a @click.prevent="openInDefaultBrowser($event)" :href="watchPageURL" class="link"><i class="icon-browser"></i>番組ページを開く</a></li>
          <li class="popup-menu-item"><a @click="/*copyProgramURL*/" class="link"><i class="icon-clipboard-copy"></i>番組URLをコピーする</a></li>
        </ul>
        <ul class="popup-menu-list">
          <li class="popup-menu-item"><a @click="editProgram" :disabled="isEditing" class="link"><i class="icon-edit"></i>番組を編集する</a></li>
        </ul>
        <ul class="popup-menu-list">
          <li class="popup-menu-item"><a @click.prevent="openInDefaultBrowser($event)" :href="twitterShareURL" class="link"><i class="icon-twitter"></i>ツイートする</a></li>
          <li class="popup-menu-item"><a @click.prevent="openInDefaultBrowser($event)" :href="contentTreeURL" class="link"><i class="icon-contents-tree"></i>コンテンツツリーを見る</a></li>
          <li class="popup-menu-item"><a @click.prevent="openInDefaultBrowser($event)" :href="creatorsProgramURL" class="link"><i class="icon-creator-promotion-program"></i>奨励プログラムに登録する</a></li>
        </ul>
      </div>
      <div class="indicator" :class="{ 'is-show': showPopupMenu }" slot="reference">
        <i class="icon-drop-down-arrow"></i>
      </div>
    </popper>
  </div>
</template>

<script lang="ts" src="./ProgramInfo.vue.ts"></script>
<style lang="less" scoped>
@import '../../styles/index';

.program-info {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 16px;
}

.program-info-description {
  min-width: 0;
  flex-grow: 1;
}

.program-title {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.program-title-link {
  .text-ellipsis;
  color: var(--color-text-accent);
  font-size: 14px;
  font-weight: @font-weight-bold;
}

.program-button {
  margin-left: 16px;
}

.community-name {
  display: flex;
  align-items: center;
  margin: 0;

  .icon-lock {
    color: var(--color-icon-primary);
    font-size: @font-size1;
    margin-right: 8px;
  }
}

.community-name-link {
  .text-ellipsis;
  font-size: @font-size2;
}

.community-icon {
  margin-right: 16px;
  flex-shrink: 0;
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--color-secondary-dark);

  .community-thumbnail {
    border-radius: 50%;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: @z-index-default-content;
  }

  &.is-onAir {
    border-color: var(--color-live);

    &:before, &:after {
      content: '';
      display: block;
      position: absolute;
      border-radius: 50%;
      background-color: var(--color-live);
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      
      animation-duration: 6s;
      animation-iteration-count: infinite;
    }

    &::after {
      animation-name: thumbnail-live-effect1;
    }

    &::before {
      animation-name: thumbnail-live-effect2;
    }
  }
}

.popper {
  .popper-styling();
  width: 260px;
}

.indicator {
  cursor: pointer;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 16px;

  i {
    font-size: @font-size1;
  }

  &:hover {
    background-color: var(--color-bg-active);

    i {
      color: var(--color-icon-hover);
    }
  }

  &.is-show {
    background-color: var(--color-bg-active);

    i {
      color: var(--color-icon-active);
    }
  }
}

@keyframes thumbnail-live-effect1 {
    0% {
        opacity: .8;
        width: 40px;
        height: 40px;
    }

    40% {
        opacity: 0;
        width: 50px;
        height: 50px;
    }

    100% {
        opacity: 0;
    }
}

@keyframes thumbnail-live-effect2 {
    0% {
        opacity: .8;
        width: 40px;
        height: 40px;
    }

    40% {
        opacity: 0;
        width: 60px;
        height: 60px;
    }

    100% {
        opacity: 0;
    }
}
</style>
