<template>
  <div>
    <div class="onboarding-step">
      <div class="onboarding-title">Optimize</div>
      <div class="onboarding-desc">We're connecting to OBS and pulling your previous settings for a seamless conversion.</div>
      <div class="running-setup-container optimizing">
        <div class="running-setup__deco running-setup__deco--right">
          <img src="../../../../media/images/decorations/right-running.png" />
        </div>
        <div class="running-setup__deco running-setup__deco--left">
          <img src="../../../../media/images/decorations/left-running.png" />
        </div>
        <div class="running-setup-row">
          <div class="running-setup-title">Initialzing ...</div>
          <div class="running-setup-percent">100%</div>
        </div>
        <div class="running-setup-row">
          <div class="running-setup-title">Connecting to OBS ...</div>
          <div class="running-setup-percent">100%</div>
        </div>
        <div class="running-setup-row">
          <div class="running-setup-title">Pulling settings ...</div>
          <div class="running-setup-percent">100%</div>
        </div>
        <div class="running-setup-row">
          <div class="running-setup-title">Starting import ...</div>
          <div class="running-setup-percent">100%</div>
        </div>
        <div class="running-setup-row">
          <div class="running-setup-title">Finalizing ...</div>
          <div class="running-setup-percent">89%</div>
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
export default class OptimizeC extends Vue {

}
</script>
