<template>
<modal-layout
  bare-content
  :title="$t('streaming.nicoliveProgramSelector.title')"
  :show-controls="false"
  :custom-controls="true"
  >
  <div slot="content" class="nicolive-program-selector">
    <NavMenu v-model="currentStep" class="side-menu" data-test="SideMenu">
      <NavItem
        v-for="step in steps"
        :enabled="shouldEnableNavItem(step)"
        :key="step"
        :to="step"
        :ico=" isCompletedStep(step) ? 'icon-check' : undefined"
        :data-test="step"
      >
        <h3>{{ getStepTitleForMenu(step) }}</h3>
        <p v-if="isCompletedStep(step)">{{ getSelectedValueForDisplay(step) }}</p>
      </NavItem>
    </NavMenu>
    <div class="nicolive-program-selector-container">
      <Step
        v-if="currentStep === 'providerTypeSelect'"
        :class="'provider-type-select-step'"
        :title="getStepTitle(currentStep)"
        :desciption="getStepDescription(currentStep)">
        <li v-for="providerType in providerTypes" :key="providerType">
          <a @click="onSelectProviderType(providerType)">
            <p class="anchor-text">{{ getProviderTypeProgramText(providerType) }}</p>
          </a>
        </li>
      </Step>
      <Step
        v-if="currentStep === 'channelSelect'"
        :class="'broadcast-channel-select-step'"
        :title="getStepTitle(currentStep)"
        :desciption="getStepDescription(currentStep)">
          <li v-for="channel in queryParams.channels" :key="channel.id" >
            <a @click="onSelectChannel(channel.id, channel.name)">
              <img :src="channel.thumbnailUrl" :alt="channel.name" class="channel-thumbnail" />
              <p class="anchor-text">{{ channel.name }}</p>
            </a>
          </li>
      </Step>
      <Step
          v-if="currentStep === 'programSelect'"
          :class="'program-select-step'"
          :title="getStepTitle(currentStep)"
          :desciption="getStepDescription(currentStep)">
          <li v-for="program in candidatePrograms" :key="program.id">
            <a @click="onSelectBroadcastingProgram(program.id, program.title)" >
              <p class="anchor-text">{{ program.title }}</p>
              <p class="annotation">
                <span class="lv">{{ program.id }}</span>
              </p>
            </a>
          </li>
      </Step>
      <Step
        v-if="currentStep === 'confirm'"
        :class="'confirm-step'"
        :title="getStepTitle(currentStep)"
        :desciption="getStepDescription(currentStep)">
          <li v-for="step in selectionSteps" :key="step">
            <div class="caption">{{ getStepTitle(step) }}</div>
            <div class="value">{{ getSelectedValueForDisplay(step) || '-' }}</div>
          </li>
      </Step>
    </div>
  </div>
  <div slot="controls" v-if="currentStep === 'confirm'">
    <button
      class="button button--action"
      @click="ok"
      data-test="Done">
      {{ $t('streaming.nicoliveProgramSelector.done') }}
    </button>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./NicoliveProgramSelector.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/_colors";

.nicolive-program-selector {
  display: flex;
  height: 100%;
}

.side-menu {
  overflow-y: auto;
}

.nicolive-program-selector-container {
  margin: 0;
  overflow-y: auto;
  background-color: @bg-tertiary;
  width: 100%;
}

.list {
  margin-left: 0;
  width: 100%;
  > li {
    list-style: none;
    position: relative;
    padding: 0;
    margin: 0;
    border-bottom: 2px solid @bg-secondary;
    &:hover {
      background-color: @bg-secondary;
    }
    &:last-child {
      border-bottom: none;
    }
    > a {
      width: 100%;
      display: block;
      text-align: left;
      padding: 8px 0;
      margin-left: 0;
      margin-right: 0;
      cursor: pointer;
      position: relative;
      z-index: 2;
      transition: color 200ms ease-in;
      overflow: hidden;
      text-decoration: none;
      color: @text-secondary;
      .channel-thumbnail {
        width: 36px;
        height: 36px;
        background-color: @bg-secondary;
        overflow: hidden;
        border-radius: 50%;
      }
      .anchor-text {
        display: inline-block;
        font-size: 16px;
        text-indent: 1.3em;
        margin-bottom: 0;
        width: 80%;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        box-sizing: border-box;
      }
      .annotation {
        display: inline-block;
        font-size: 14px;
        margin-bottom: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        box-sizing: border-box;
        .lv {
          font-size: 12px;
          background-color: @text-secondary;
          color: @bg-primary;
          border-radius: 2px;
          padding: 2px 4px;
        }
      }
      &:after {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        content: '';
        background-color: @text-primary;
        position: absolute;
        left: 5px;
        top: 9px;
        transition: all 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
        opacity: 0;
        z-index: 100;
      }
    }
  }
}
.confirm-step {
  ul {
    > li {
      font-size: 16px;
      display: flex;
      justify-content: space-around;
      > .caption {
        width: 30%;
      }
      > .value {
        width: 60%;
      }
    }
  }
}
</style>
