<template>
  <div>
    <div class="section" v-if="isNiconicoLoggedIn()">
      <div class="input-label">
        <label>{{ $t('settings.optimizationForNiconicoLiveService') }}</label>
      </div>
      <ObsBoolInput :value="optimizeForNiconicoModel" @input="setOptimizeForNiconico" />
      <ObsBoolInput
        :value="showOptimizationDialogForNiconicoModel"
        v-show="optimizeForNiconicoModel.value"
        @input="setShowOptimizationDialogForNiconico"
        class="optional-item"
      />
      <ObsBoolInput
        :value="optimizeWithHardwareEncoderModel"
        v-show="optimizeForNiconicoModel.value"
        @input="setOptimizeWithHardwareEncoder"
        class="optional-item"
      />

      <ObsBoolInput :value="autoCompactModel" @input="setAutoCompact" />
      <ObsBoolInput :value="showAutoCompactDialogModel" @input="setShowAutoCompactDialog" />
    </div>

    <div class="section">
      <div class="input-label">
        <label>{{ $t('settings.cacheManagement') }}</label>
      </div>
      <p>{{ $t('settings.cacheClearDescription') }}</p>

      <div class="flex">
        <a class="button button--secondary" @click="showCacheDir">
          {{ $t('settings.showCacheDirectory') }}
        </a>
        <a class="button button--secondary" @click="deleteCacheDir">
          {{ $t('settings.deleteCacheAndRestart') }}
        </a>
      </div>

      <div class="input-label">
        <label for="cacheId">{{ $t('settings.cacheId') }}</label>
      </div>
      <p>{{ $t('settings.cacheIdDescription') }}</p>

      <div class="cacheid-view">
        <label>
          <input type="checkbox" v-model="showCacheId" />
          <div class="view-button"><i class="icon-unhide off" /><i class="icon-hide on" /></div>
          <input :type="showCacheId ? 'text' : 'password'" id="cacheId" :value="cacheId" readonly />
        </label>
        <button class="cacheid-copy button button--secondary" @click="copyToClipboard(cacheId)">
          {{ $t('settings.cacheIdCopy') }}
        </button>
      </div>
    </div>

    <div class="section">
      <ObsBoolInput
        :value="pollingPerformanceStatisticsModel"
        @input="setPollingPerformanceStatistics"
      />
      <p>{{ $t('settings.pollingPerformanceStatisticsDescription') }}</p>
    </div>
  </div>
</template>

<script lang="ts" src="./ExtraSettings.vue.ts"></script>

<style lang="less">
@import '../styles/index';

.optional-item {
  margin-left: 24px;
}

.cacheid-view {
  display: flex;
  justify-content: start;
  align-items: center;
  font-size: @font-size4;

  label {
    cursor: pointer;
    display: flex;
    height: 36px;
    margin: 0;
    padding: 0;
    justify-content: start;
    align-items: center;
    color: var(--color-text-active);
    border: 1px solid var(--color-input);
    border-radius: 4px;
    margin-bottom: 16px;

    input[type='password'] {
      font-family: 'Verdana', sans-serif;
      font-size: 0;
      width: 332px;
      color: var(--color-text-light);
    }

    input[type='checkbox'] {
      display: none;

      & ~ .view-button {
        .transition;
        width: 36px;
        cursor: pointer;
        display: inline-block;
        position: relative;
        text-align: center;
        font-size: @font-size5;
        padding: 0 8px;

        &:hover {
          color: @white;
        }

        .on {
          display: inline-block;
        }
        .off {
          display: none;
        }
      }
      &:checked ~ .view-button {
        .on {
          display: none;
        }
        .off {
          display: inline-block;
          color: var(--color-text-active);
        }
      }

      & ~ input {
        cursor: default;
        font-family: 'Verdana', sans-serif;
        background: none;
        border: none;
        border-radius: 0;
        outline: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        color: @text-primary;
        text-align: center;
        padding: 0 8px;
        margin: 0;
        box-sizing: border-box;
        width: 320px;
        color: var(--color-text-light);
        font-size: @font-size4;
      }

      &:checked ~ input {
        font-size: 14px;
        color: @text-primary;
      }
    }
  }

  .cacheid-copy {
    position: relative;
    margin-left: 8px;

    i {
      margin-right: 6px;
    }

    &:hover {
      background-color: var(--color-button-secondary-hover);
    }

    &:before {
      position: absolute;
      top: -8px;
      left: 16px;
      transition: all 0s;
      opacity: 0;
      content: 'Copied!';
      background-color: @text-primary;
      color: @bg-secondary;
      padding: 4px 8px;
      border-radius: 3px;
    }
    &:active {
      &:before {
        transform: scale(1.2) translateY(-8px);
        transition: all 0.3s;
        opacity: 1;
      }
    }
  }
}

.button {
  & + & {
    margin-left: 16px;
  }
}
</style>
