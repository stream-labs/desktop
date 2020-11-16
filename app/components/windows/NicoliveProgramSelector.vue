<template>
<modal-layout
  bare-content
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
        :class="'step-item'"
      >
        <h3 class="step-item-title">{{ getStepTitleForMenu(step) }}</h3>
        <p class="step-item-selected-item" v-if="isCompletedStep(step)">{{ getSelectedValueForDisplay(step) }}</p>
      </NavItem>
    </NavMenu>
    <div class="nicolive-program-selector-container">
      <Step
        v-if="currentStep === 'providerTypeSelect'"
        :class="'provider-type-select-step'"
        :title="getStepTitle(currentStep)"
        :description="getStepDescription(currentStep)">
        <ul class="list">
          <li v-for="providerType in providerTypes" :key="providerType">
            <a @click="onSelectProviderType(providerType)">
              <p class="anchor-text">{{ getProviderTypeProgramText(providerType) }}</p>
            </a>
          </li>
        </ul>
      </Step>
      <Step
        v-if="currentStep === 'channelSelect'"
        :class="'channel-select-step'"
        :title="getStepTitle(currentStep)"
        :description="getStepDescription(currentStep)">
        <ul class="list">
          <li v-for="channel in candidateChannels" :key="channel.id" >
            <a @click="onSelectChannel(channel.id, channel.name)">
              <img :src="channel.thumbnailUrl" :alt="channel.name" class="channel-thumbnail" />
              <p class="anchor-text">{{ channel.name }}</p>
            </a>
          </li>
        </ul>
      </Step>
      <Step
          v-if="currentStep === 'programSelect'"
          :class="'program-select-step'"
          :title="getStepTitle(currentStep)"
          :description="getStepDescription(currentStep)">
          <!-- 文言に改行タグ <br /> を含むため、 v-html で HTML を注入しています。-->
          <div class="no-program-message"
             v-if="canShowNoProgramsSection()"
             v-html="$t('streaming.nicoliveProgramSelector.noChannelPrograms')"
          />
          <ul class="list" v-else>
            <li v-for="program in candidatePrograms" :key="program.id">
              <a @click="onSelectBroadcastingProgram(program.id, program.title)" >
                <p class="annotation">
                  <span class="lv">{{ program.id }}</span>
                </p>
                <p class="anchor-text">{{ program.title }}</p>
              </a>
            </li>
          </ul>
      </Step>
      <Step
        v-if="currentStep === 'confirm'"
        :class="'confirm-step'"
        :title="getStepTitle(currentStep)"
        :description="getStepDescription(currentStep)">
          <ul class="list">
            <li v-for="step in selectionSteps" :key="step">
              <div class="caption">{{ getStepTitleForMenu(step) }}</div>
              <div class="value">{{ getSelectedValueForDisplay(step) || '-' }}</div>
            </li>
          </ul>
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
@import "../../styles/mixins";

.nicolive-program-selector {
  display: flex;
  height: 100%;
}

.side-menu {
  overflow-y: auto;
  padding: 8px 0;
}

.step-item {
  display: flex;
  align-items: center;
  padding: 12px 40px 12px 16px;
  position: relative;

  & /deep/ .icon-check {
    font-size: 12px;
    color: @accent;
    width: auto;
    margin: 0;
    position: absolute;
    top: 50%;
    left: inherit;
    right: 16px;
    transform: translateY(-50%);
  }

  & /deep/ .nav-item__name {
    max-width: inherit;
  }

  &.active {
    color: @white;
    cursor: default;
    .bg-active();
  }

  &:not(.active):not(.disabled):hover {
    .bg-hover();
  }
}

.step-item-title {
  font-size: 14px;
  color: @light-grey;
  margin: 0;

  .step-item.active & {
    color: @text-active;
  }
}

.step-item-selected-item {
  font-size: 12px;
  color: @grey;
  margin: 4px 0 0;
  .text-ellipsis();
}

.nicolive-program-selector-container {
  margin: 0;
  overflow-y: auto;
  background-color: @bg-tertiary;
  width: 100%;
}

.list {
  margin: 0;
  width: 100%;
  padding: 8px 0;

  > li {
    list-style: none;
    position: relative;
    margin: 0;
    padding: 0;

    .confirm-step & {
      display: flex;
      flex-direction: column;
      padding: 12px 24px;
    }

    > .caption {
      color: @grey;
      font-size: 12px;
      margin-bottom: 8px;
    }

    > .value {
      color: @white;
      font-size: 14px;
    }

    > a {
      display: flex;
      align-items: center;
      width: 100%;
      min-height: 56px;
      padding: 12px 16px;
      cursor: pointer;
      text-decoration: none;

      &:hover {
        .bg-hover();
      }

      .program-select-step & {
        flex-direction: column;
        align-items: flex-start;
      }

      .channel-thumbnail {
        width: 40px;
        height: 40px;
        margin-right: 16px;
        background-color: @bg-secondary;
        overflow: hidden;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .anchor-text {
        color: @white;
        font-size: 14px;
        margin: 0;
        .text-ellipsis();
      }

      .annotation {
        margin-bottom: 8px;
        
        .lv {
          display: block;
          font-size: 12px;
          line-height: 24px;
          background-color: @bg-quinary;
          color: @white;
          border-radius: 2px;
          padding: 0 8px;
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

.no-program-message {
  color: @grey;
  text-align: center;
  margin: auto;
  padding-bottom: 80px;
}
</style>
