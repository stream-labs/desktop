<template>
  <div class="program-info">
    <div class="community-icon">
      <img :src="communitySymbol" class="community-thumbnail" :alt="communityName" />
    </div>
    <div class="program-info-description">
      <h1 class="program-title" v-tooltip.bottom="programTitleTooltip">{{programTitle}}</h1>
      <h2 class="community-name-wrapper"><i v-if="programIsMemberOnly" class="icon-lock" v-tooltip.bottom="programIsMemberOnlyTooltip"></i><span class="community-name" v-tooltip.bottom="communityNameTooltip">{{communityName}}</span></h2>
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
  color: @white;
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 4px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.program-button {
  margin-left: 16px;
}

.community-name-wrapper {
  display: flex;
  align-items: center;
  color: @light-grey;
  margin: 0;

  .community-name {
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  } 

  .icon-lock {
    font-size: 10px;
    margin-right: 6px;
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