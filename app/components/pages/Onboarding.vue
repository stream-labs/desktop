<template>
  <div class="onboarding">
    <component :is="currentView" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import Connect from './onboarding_steps/Connect.vue';
import OptimizeA from './onboarding_steps/OptimizeA.vue';
import OptimizeB from './onboarding_steps/OptimizeB.vue';
import SetupOptions from './onboarding_steps/SetupOptions.vue';
import OptimizeC from './onboarding_steps/OptimizeC.vue';
import SuccessfullyImported from './onboarding_steps/SuccessfullyImported.vue';
import BrowseOverlays from './onboarding_steps/BrowseOverlays.vue';
import SelectWidgets from './onboarding_steps/SelectWidgets.vue';
import { OnboardingService } from '../../services/onboarding';
import { Inject } from '../../util/injector';

@Component({
  components: {
    Connect,
    OptimizeA,
    OptimizeB,
    SetupOptions,
    OptimizeC,
    SuccessfullyImported,
    BrowseOverlays,
    SelectWidgets
  }
})
export default class Onboarding extends Vue {

  @Inject()
  onboardingService: OnboardingService;

  get currentView() {
    return this.onboardingService.currentStep;
  }

}
</script>

<style lang="less" scoped>
@import "../../styles/index";

.onboarding {
  background-color: @onboarding-bg;
}
</style>

<style lang="less">
@import "../../styles/index";

.onboarding {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  flex-direction: column;

  .button--lg {
    width: 300px;
    padding: 0 0;
    font-size: 12px;
    letter-spacing: 1px;
    font-weight: normal;
    margin-top: 15px;
  }
}

.onboarding-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 300px;

  .button--lg {
    &:first-child {
      margin-top: 0;
    }
  }
}

.onboarding-step--wide {
  width: 550px;
}

.onboarding-step--full {
  width: 100%;
  position: absolute;
  top: 0px;
  left: 0;
  right: 0;
  bottom: 0;
  display: inline-block
}

.onboarding-image {
  width: 200px;
  margin-bottom: 30px;
}

.onboarding-title {
  color: @white;
  font-size: 22px;
  margin-bottom: 20px;
  letter-spacing: .5px;
}

.onboarding-title--sm {
  font-size: 15px;
  .semibold;
  color: @white;
}

.onboarding-desc {
  color: @grey;
  margin-bottom: 20px;
  padding: 0 20px;
}

.setup-later {
  margin-top: 20px;
  color: @grey;

  span {
    display: block;
    margin-bottom: 4px;
  }

  a {
    text-decoration: underline;
    transition: all 275ms;
    &:hover {
      color: @white;
    }
  }
}

.running-setup-container {
  width: 100%;
  padding: 30px;
  color: @white;
  background-color: @night-primary;
  margin-bottom: 20px;
  height: 270px;
  position: relative;
  .radius;

  &.optimizing {
    .running-setup-row {
      &:nth-child(1), &:nth-child(6) {
        color: #BBE380;
      }

      &:nth-child(2), &:nth-child(7) {
        color: #E98282;
      }

      &:nth-child(3), &:nth-child(8) {
        color: #79D88A;
      }

      &:nth-child(4), &:nth-child(9) {
        color: #7384CE;
      }

      &:nth-child(5), &:nth-child(10) {
        color: #B18F6D;
      }
    }
  }
}

.running-setup-row {
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.running-setup-row--complete {
  color: @teal-bright;
}

.running-setup-percent {
  color: @grey;
}

.running-setup__deco {
  position: absolute;
  top: 0;
  height: 240px;
  width: auto;
  margin: 15px 0;

  img {
    height: 100%;
    width: auto;
  }
}

.running-setup__deco--right {
  right: -90px;
}

.running-setup__deco--left {
  left: -90px;
}
</style>
