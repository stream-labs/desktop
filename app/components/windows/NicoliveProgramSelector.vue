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
      class="button button--primary"
      @click="ok"
      data-test="Done">
      {{ $t('streaming.nicoliveProgramSelector.done') }}
    </button>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./NicoliveProgramSelector.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

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
  height: auto;
  padding: 12px 40px 12px 16px;
  position: relative;

  & /deep/ .icon-check {
    font-size: @font-size2;
    color: var(--color-text-active);
    width: auto;
    margin: 0;
    position: absolute;
    top: 50%;
    left: inherit;
    right: 20px;
    transform: translateY(-50%);
  }

  &:not(.active):hover /deep/ .icon-check {
    color: var(--color-text-active);
  }

  & /deep/ .nav-item__name {
    max-width: inherit;
  }

  &.active {
    cursor: default;
  }
}

.step-item-title {
  color: var(--color-text);
  margin: 0;

  .active & {
    color: var(--color-text-active);
  }

  .disabled & {
    cursor: default;
    color: var(--color-text-disabled);
  }
}

.step-item-selected-item {
  font-size: @font-size2;
  color: var(--color-text-dark);
  margin: 4px 0 0;
  .text-ellipsis;
}

.nicolive-program-selector-container {
  margin: 0;
  padding: 16px 8px 16px 0;
  overflow-y: scroll;
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
      padding: 8px 16px;
    }

    > .caption {
      color: var(--color-text-dark);
      font-size: @font-size2;
      margin-bottom: 8px;
    }

    > .value {
      color: @white;
      font-size: @font-size4;
    }

    > a {
      display: flex;
      align-items: center;
      width: 100%;
      min-height: 56px;
      padding: 8px 16px;
      cursor: pointer;
      text-decoration: none;

      .program-select-step & {
        flex-direction: column;
        align-items: flex-start;
      }

      .channel-thumbnail {
        width: 40px;
        height: 40px;
        margin-right: 16px;
        background-color: var(--color-black);
        overflow: hidden;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .anchor-text {
        color: var(--color-text);
        font-size: @font-size4;
        margin: 0;
        .text-ellipsis;
      }

      &:hover {
        .anchor-text {
          color: var(--color-text-light);
        }
      }

      .annotation {
        margin-bottom: 8px;
        
        .lv {
          display: block;
          font-size: 12px;
          line-height: 24px;
          background-color: var(--color-bg-quinary);
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
        background-color: var(--color-text-active);
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
  color: var(--color-text-dark);
  text-align: center;
  margin: auto;
  padding-bottom: 80px;
}
</style>
