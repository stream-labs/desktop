<template>
  <div>
    <div class="onboarding-step">
      <div class="onboarding-title">{{ $t('Optimize') }} </div>
      <div class="onboarding-desc">{{ $t('We\'re analyzing your internet speed and computer hardware to give you the best settings possible.') }} </div>

      <div class="running-setup-container optimizing">
        <div class="running-setup__deco running-setup__deco--right">
          <img src="../../../../media/images/decorations/right.gif" />
        </div>
        <div class="running-setup__deco running-setup__deco--left">
          <img src="../../../../media/images/decorations/left.gif" />
        </div>
        <div
          class="running-setup-row"
          v-for="step in stepInfo"
          :key="step.description">
          <div class="running-setup-title typing">{{ step.summary }}</div>
          <div
            v-if="step.percentage != null"
            class="running-setup-percent delay">
            {{ step.percentage }}%
          </div>
        </div>

        <div v-if="done" class="running-setup-row">
          <div class="running-setup-title">{{ $t('Done!') }}</div>
        </div>
      </div>
      <button
        class="button button--action button--lg"
        @click="next"
        :disabled="!done">
        {{ $t('Next') }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" src="./OptimizeB.vue.ts"></script>

<style lang="less">
.typing {
  white-space: nowrap;
  overflow: hidden;
  text-align: left;
  // animation: typing 3s steps(30, end),
}

/* The typing effect */
@keyframes typing {
  from { width: 0; }
  to { width: 100%; }
}

// .delay {
//   animation: 3s 0s delay;
// }

@keyframes delay {
  0% { opacity: 0; }
  100% { opacity: 0; }
}
</style>
