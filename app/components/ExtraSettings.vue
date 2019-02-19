<template>
<div>
  <div class="section" v-if="isNiconicoLoggedIn()">
    <div class="input-label">
      <label>{{ $t('settings.optimizationForNiconicoLiveService')}}</label>
    </div>
    <BoolInput
      :value="optimizeForNiconicoModel"
      @input="setOptimizeForNiconico" />
    <BoolInput
      :value="showOptimizationDialogForNiconicoModel"
      v-show="optimizeForNiconicoModel.value"
      @input="setShowOptimizationDialogForNiconico"
      class="optional-item" />
  </div>

  <div class="section">
    <div class="input-label">
      <label>{{ $t('settings.cacheManagement')}}</label>
    </div>
    <p>{{ $t('settings.cacheClearDescription')}}</p>

    <a class="button button--action" @click="showCacheDir">
      {{ $t('settings.showCacheDirectory')}}
    </a>

    <a class="button button--action" @click="deleteCacheDir">
      {{ $t('settings.deleteCacheAndRestart') }}
    </a>

    <div class="input-label">
      <label for="cacheId">{{ $t('settings.cacheId')}}</label>
    </div>
    <p>{{ $t('settings.cacheIdDescription')}}</p>

    <div class="cacheid-view">
        <label>
            <input type="checkbox" v-model="showCacheId" />
            <div class="view-button">
                <i class="icon-unhide on"/><i class="icon-hide off"/>
            </div>
            <input :type="showCacheId ? 'text' : 'password'" id="cacheId" :value="cacheId" readonly />
        </label>
        <button class="cacheid-copy" @click="copyToClipboard(cacheId);"><i class="icon-clipboard-copy"/>{{ $t('settings.cacheIdCopy')}}</button>
    </div>
  </div>

  <div class="section">
    <BoolInput
      :value="pollingPerformanceStatisticsModel"
      @input="setPollingPerformanceStatistics" />
    <p>{{ $t('settings.pollingPerformanceStatisticsDescription') }}</p>
  </div>
</div>
</template>

<script lang="ts" src="./ExtraSettings.vue.ts"></script>

<style lang="less">
@import "../styles/_colors";

.optional-item {
  margin-left: 24px;
}

.cacheid-view {
    display: flex;
    justify-content: start;
    align-items: center;
    font-size: 14px;
    margin-bottom: 16px;
    label {
        cursor: pointer;
        display: flex;
        padding: 0;
        justify-content: start;
        align-items: center;
        background-color: @bg-secondary;
        color: @text-primary;
        border: 1px solid @text-secondary;
        border-radius: 3px;
        input[type="passwprd"] {
            font-family: 'Verdana',sans-serif;
            font-size: 0;
            width: 332px;
            color: @white;
        }

        input[type="checkbox"] {
            display: none;

            & ~ .view-button {
                cursor: pointer;
                display: inline-block;
                position: relative;
                text-align: center;
                font-size: 20px;
                padding: 0 8px;
                transition: transform .4s ease;
                background-color: @text-secondary;
                color: @bg-secondary;
                border-radius: 3px;
                &:hover {
                    color: @white;
                }
                .on {display: inline-block;}
                .off {display: none;}
            }
            &:checked ~ .view-button {
                .on {display: none;}
                .off {
                    display: inline-block;
                    color: @white;
                    &:hover {
                        color: @bg-secondary;
                    }
                }
            }
            & ~ input {
                cursor: default;
                font-family: 'Verdana',sans-serif;
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
                color: @white;
                font-size: 14px;
            }

            &:checked ~ input {
                font-size: 14px;
                color: @text-primary;
            }
        }
    }
    .cacheid-copy {
        position: relative;
        cursor: pointer;
        color: @white;
        background-color: @accent;
        border-radius: 3px;
        padding: 10px 6px;
        margin-left: 8px;
        border: none;
        outline: none;
        i {
          margin-right: 6px;
        }
        &:hover {
            background-color: @accent-hover;
        }
        &:before {
            position: absolute;
            top: -8px;
            left: 16px;
            transition: all 0s;
            opacity: 0;
            content: "Copied!";
            background-color: @text-primary;
            color: @bg-secondary;
            padding: 4px 8px;
            border-radius: 3px;
        }
        &:active {
            &:before {
                transform: scale(1.2) translateY(-8px);
                transition: all .3s;
                opacity: 1;
            }
        }
    }
}

</style>
