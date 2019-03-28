<template>
  <div class="onboarding">
    <component :is="currentView" />
  </div>
</template>

<script lang="ts" src="./Onboarding.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.onboarding {
  background-color: var(--background);
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
    .margin-top(2);
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
  width: 1200px;
  margin: 0 auto;
}

.onboarding-step--full {
  width: 100%;
  position: absolute;
  top: 0;
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
  color: var(--white);
  font-size: 22px;
  .margin-bottom(3);
}

.onboarding-title--sm {
  font-size: 15px;
  .weight(@medium);
  color: var(--white);
}

.onboarding-desc {
  color: var(--paragraph);
  .margin-bottom(3);
  padding: 0 16px;
}

.setup-later {
  .margin-top(3);
  color: var(--paragraph);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  span {
    display: block;
    margin-bottom: 4px;
  }

  a {
    text-decoration: underline;
    .transition();
    color: var(--paragraph);

    &:hover {
      color: var(--link-active);
    }
  }
}

.running-setup-container {
  width: 100%;
  padding: 30px;
  color: var(--background);
  background-color: var(--section);
  .margin-bottom(2);
  height: 270px;
  position: relative;
  .radius();

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
  color: var(--paragraph);
}

.running-setup-percent {
  color: var(--paragraph);
}

.running-setup__deco {
  position: absolute;
  top: 0;
  height: 240px;
  width: auto;
  margin: 16px 0;

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
