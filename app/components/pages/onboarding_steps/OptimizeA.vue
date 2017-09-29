<template>
  <div>
    <div class="onboarding-step">
      <div class="onboarding-image"><img src="../../../../media/images/optimize.png"></div>
      <div class="onboarding-title">Optimize</div>
      <div class="onboarding-desc">Click below and we'll analyze your internet speed and computer hardware to give you the best settings possible.</div>
      <button class="button button--action button--lg" @click="next">Start</button>

      <div class="setup-later">
        <span>Rather do this manually?</span>
        <a @click="skip">Setup later</a>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./OptimizeA.vue.ts"></script>
