<template>
  <div class="program-info">
    <div class="community-icon">
      <img :src="communitySymbol" class="community-thumbnail" :alt="communityName" />
    </div>
    <div class="program-info-description">
      <h1 class="program-title" v-tooltip.bottom="programTitleTooltip">
        <a :href="watchPageURL" @click.prevent="openInDefaultBrowser($event)" class="program-title-link" >
          {{programTitle}}
        </a>
      </h1>
      <h2 class="community-name">
        <i v-if="programIsMemberOnly" class="icon-lock" v-tooltip.bottom="programIsMemberOnlyTooltip"></i>
        <a :href="communityPageURL" @click.prevent="openInDefaultBrowser($event)" class="community-name-link" v-tooltip.bottom="communityNameTooltip">
          {{communityName}}
        </a>
      </h2>
    </div>
    <div class="program-button">
      <button v-if="programStatus === 'onAir' || programStatus === 'reserved'" @click="endProgram" :disabled="isEnding || programStatus === 'reserved'" class="button button--end-program button--soft-warning">番組終了</button>
      <button v-else-if="programStatus === 'end'" @click="createProgram" :disabled="isCreating" class="button button--create-program">番組作成</button>
      <button v-else @click="startProgram" :disabled="isStarting" class="button button--start-program">番組開始</button>
    </div>
  </div>
</template>

<script lang="ts" src="./ProgramInfo.vue.ts"></script>
<style lang="less" scoped>
@import "../../styles/_colors";
@import "../../styles/mixins";

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
  font-size: 13px;
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
  margin-right: 10px;
  flex-shrink: 0;

  .community-thumbnail {
    width: 44px;
    height: 44px;
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
