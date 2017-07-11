<template>
  <div>
    <div class="onboarding-step">
      <div class="onboarding-title">Optimize</div>
      <div class="onboarding-desc">We're analyzing your internet speed and computer hardware to give you the best settings possible.</div>

      <div class="running-setup-container optimizing">
        <div class="running-setup__deco running-setup__deco--right">
          <img src="../../../../media/images/decorations/right-running.png" />
        </div>
        <div class="running-setup__deco running-setup__deco--left">
          <img src="../../../../media/images/decorations/left-running.png" />
        </div>
        <div class="running-setup-row">
          <div class="running-setup-title">Initialzing modem ...</div>
          <div class="running-setup-percent">100%</div>
        </div>
        <div class="running-setup-row">
          <div class="running-setup-title">Dialing 435-634-3322 ...</div>
          <div class="running-setup-percent">100%</div>
        </div>
        <div class="running-setup-row">
          <div class="running-setup-title">Connected at 3728 bps ...</div>
          <div class="running-setup-percent">100%</div>
        </div>
        <div class="running-setup-row">
          <div class="running-setup-title">Requesing network attention ...</div>
          <div class="running-setup-percent">100%</div>
        </div>
        <div class="running-setup-row">
          <div class="running-setup-title">Talking to network ...</div>
          <div class="running-setup-percent">100%</div>
        </div>
        <div class="running-setup-row">
          <div class="running-setup-title">Connecting to streamlabs ...</div>
          <div class="running-setup-percent">14%</div>
        </div>
      </div>
      <button class="button button--action button--lg" disabled>Next</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';

@Component({})
export default class OptimizeB extends Vue {

}
</script>