<template>
  <div class="program-info">
    <div class="community-icon">
      <img :src="communitySymbol" class="community-thumbnail" :alt="communityName" />
    </div>
    <div class="program-info-description">
      <h1 class="program-title" v-tooltip.bottom="programTitle">
        <a
          :href="watchPageURL"
          @click.prevent="openInDefaultBrowser($event)"
          class="program-title-link"
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
          class="community-name-link"
          v-tooltip.bottom="communityName"
        >
          {{ communityName }}
        </a>
      </h2>
    </div>
    <popper trigger="hover" :options="{ placement: 'bottom-start' }" v-if="compactMode">
      <div class="popper">
        <ul>
          <li>TODO</li>
        </ul>
      </div>
      <div class="indicator" slot="reference">
        <i class="icon-drop-down-arrow"></i>
      </div>
    </popper>
    <div class="program-button" v-if="!compactMode">
      <button
        v-if="programStatus === 'onAir' || programStatus === 'reserved'"
        @click="endProgram"
        :disabled="isEnding || programStatus === 'reserved'"
        class="button button--end-program button--soft-warning"
      >
        番組終了
      </button>
      <button
        v-else-if="programStatus === 'end'"
        @click="createProgram"
        :disabled="isCreating"
        class="button button--create-program"
      >
        番組作成
      </button>
      <button
        v-else
        @click="startProgram"
        :disabled="isStarting"
        class="button button--start-program"
      >
        番組開始
      </button>
    </div>
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
  margin-right: auto;
}

.program-title {
  margin-bottom: 4px;
}

.program-title-link {
  display: block;
  color: @white;
  font-size: 14px;
  font-weight: bold;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  text-decoration: none;

  &:hover {
    color: @text-primary;
  }
}

.program-button {
  margin-left: 16px;
}

.community-name {
  display: flex;
  align-items: center;
  margin: 0;

  .icon-lock {
    color: @light-grey;
    font-size: 10px;
    margin-right: 6px;
  }
}

.community-name-link {
  color: @light-grey;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  text-decoration: none;

  &:hover {
    color: @text-primary;
  }
}

.community-icon {
  margin-right: 16px;
  flex-shrink: 0;

  .community-thumbnail {
    width: 48px;
    height: 48px;
    border-radius: 50%;
  }
}

.button--start-program {
  font-size: 12px;
}

.button--end-program {
  font-size: 12px;
}

.button--create-program {
  font-size: 12px;
}
</style>
