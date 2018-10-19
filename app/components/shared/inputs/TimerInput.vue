<template>
  <span class="text-center">
    <div class="timer-wrapper">

      <div style="padding-right: 2px;">
        <div class="timer cursor-pointer" :class="{ wide: hasHours && hasSeconds }" @click="showTimerDropdown = !showTimerDropdown">
          <div v-if="hasHours">
            {{ getHours(max >= value && value >= min ? value : min) }}
          </div>
          <div v-if="hasHours">
            :
          </div>
          <div>
            {{ getMinutes(max >= value && value >= min ? value : min) }}
          </div>
          <div v-if="hasSeconds">
            :
          </div>
          <div v-if="hasSeconds">
            {{ getSeconds(max >= value && value >= min ? value : min) }}
          </div>
        </div>
        <div
          class="timer-icon-top"
          @mousedown="beginHold(increment, hasSeconds ? second : minute)"
          @mouseup="releaseHold()"
          @mouseout="releaseHold()"><i class="icon-dropdown"></i></div>
        <div
          class="timer-icon-bottom"
          @mousedown="beginHold(decrement, hasSeconds ? second : minute)"
          @mouseup="releaseHold()"
          @mouseout="releaseHold()"><i class="icon-dropdown"></i></div>
      </div>

      <div v-if="showTimerDropdown" class="timer timer-dropdown" :class="{ wide: hasHours && hasSeconds }">
        <div v-if="hasHours" class="time-slot-box">
          <p class="text-center bold">{{ $t('Hr') }}</p>
          <a class="text-center time-slot"
            v-for="hour in hours"
            :key="hour"
            :class="{ active: isActiveHour(hour) }"
            @click="setHour(hour)">
            {{hour}}
          </a>
        </div>
        <div class="time-slot-box">
          <p class="text-center bold">{{ $t('Min') }}</p>
          <a class="text-center time-slot"
            v-for="minute in minutes"
            :key="minute"
            @click="setMinute(minute)"
            :class="{ active: isActiveMinute(minute) }">
            {{minute}}
          </a>
        </div>
        <div v-if="hasSeconds" class="time-slot-box">
          <p class="text-center bold">{{ $t('Sec') }}</p>
          <a class="text-center time-slot"
            v-for="second in seconds"
            :key="second"
            @click="setSecond(second)"
            :class="{ active: isActiveSecond(second) }">
            {{second}}
          </a>
        </div>
      </div>

      <div class="timer-footer">
        <div v-if="hasHours">
          {{ $t('Hr') }}
        </div>
        <div>
          {{ $t('Min') }}
        </div>
        <div v-if="hasSeconds">
          {{ $t('Sec') }}
        </div>
        <div>
          &nbsp;
        </div>
      </div>

    </div>
  </span>
</template>

<script lang="ts" src="./TimerInput.vue.ts"></script>

<style lang="less" scoped>
  @import "../../../styles/index";

  .timer-wrapper {
    width: auto;
    position: relative;
    display: inline-block;
  }

  .timer {
    box-shadow: none;
    font-size: 14px;
    background: @day-dropdown-bg;
    font-family: 'Roboto';
    border: 1px solid @day-dropdown-border;
    position: relative;
    display: flex;
    justify-content: flex-start;
    width: 90px;
    height: 32px;
    line-height: 32px;
    .padding-h-sides();
    .radius();

    &:active,
    &:focus {
      box-shadow: none;
      border-color: @day-dropdown-border;
      background-color: @day-dropdown-bg;
      outline: none;
    }

    i {
      font-size: 11px;
      cursor: pointer;
    }

    div {
      .margin-right();
    }
  }

  .timer-icon-top,
  .timer-icon-bottom {
    position: absolute;
    right: 8px;

    &:hover {
      cursor: pointer;
    }
  }

  .timer-icon-top {
    top: 2px;

    .icon-dropdown {
      transform: rotate(-180deg);
      display: inline-block;
    }
  }

  .timer-icon-bottom {
    bottom: 20px;
  }

  .timer-dropdown {
    position: absolute;
    overflow-y: hidden;
    width: 90px;
    padding: 0;
    z-index: 10;
    left: 0;
    .radius();
    height: 200px;
  }

  .timer.wide,
  .timer-dropdown.wide {
    width: 120px;
  }

  .time-slot-box {
    overflow-y: auto;
    height: 200px;
    padding: 10px;
    margin: 0 !important;
  }

  .time-slot {
    padding: 5px 0;
    display: block;
  }

  .cursor-pointer {
    cursor: pointer;
  }

  .active {
    background: rgba(0,0,0,0.4);
    border-radius: 4px;
  }

  .timer-footer {
    display: flex;
    justify-content: space-around;
  }

  .night-theme {
    .timer {
      border-color: @night-dropdown-border;
      box-shadow: none;
      background: @night-dropdown-bg;
      color: @white;

      &:active,
      &:focus {
        border-color: @night-dropdown-border;
        box-shadow: none;
        background: @night-dropdown-bg;
      }
    }
  }
</style>
