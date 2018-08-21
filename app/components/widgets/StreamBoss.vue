<template>
  <widget-window v-if="wData" v-model="tabName">
    <!-- streamboss setup -->
    <div slot="goal" >
      <div v-if="hasGoal">
        <div class="section__body">
          <form-group :title="$t('Current Boss Name')">{{ wData.goal.boss_name }}</form-group>
          <form-group :title="$t('Total Health')">{{ wData.goal.total_health }}</form-group>
          <form-group :title="$t('Current Health')">{{ wData.goal.current_health }}</form-group>
          <form-group :title="$t('Mode')">{{ wData.goal.mode }}</form-group>
        </div>
      </div>

      <div v-if="!hasGoal">

        <validated-form ref="form" class="section__body" v-if="loadingState !== 'pending'">
          <form-group v-model="bossCreateOptions.total_health" :metadata="metadata.total_health"/>
          <form-group v-model="bossCreateOptions.mode" :metadata="metadata.mode"/>
        </validated-form>

        <div v-else class="loading-spinner">
          <img src="../../../media/images/loader.svg" />
        </div>
      </div>

    </div>

    <div slot="goal-controls">

      <button
          v-show="!hasGoal"
          @click="saveGoal()"
          class="button button--action"
      >{{ $t('Set Stream Boss Health') }}</button>

      <button
          class="button button--warn"
          v-show="hasGoal"
          @click="reset()"
      >{{ $t('Reset Stream Boss') }}</button>

    </div>

    <div slot="settings">
      <form-group v-model="wData.settings.fade_time" :metadata="metadata.fade_time"/>

      <form-group >
        <bool-input v-model="wData.settings.boss_heal" :metadata="metadata.boss_heal"/>
      </form-group>

      <form-group v-model="wData.settings.skin" :metadata="metadata.skin"/>
      <form-group v-model="wData.settings.kill_animation" :metadata="metadata.kill_animation"/>

      <form-group >
        <bool-input v-model="wData.settings.bg_transparent" :metadata="metadata.bg_transparent"/>
      </form-group>

      <form-group v-model="wData.settings.follow_multiplier" :metadata="metadata.follow_multiplier"/>
      <form-group v-model="wData.settings.bit_multiplier" :metadata="metadata.bit_multiplier"/>
      <form-group v-model="wData.settings.sub_multiplier" :metadata="metadata.sub_multiplier"/>
      <form-group v-model="wData.settings.donation_multiplier" :metadata="metadata.donation_multiplier"/>
      <form-group v-model="wData.settings.background_color" :metadata="metadata.background_color"/>
      <form-group v-model="wData.settings.text_color" :metadata="metadata.text_color"/>
      <form-group v-model="wData.settings.bar_text_color" :metadata="metadata.bar_text_color"/>
      <form-group v-model="wData.settings.bar_color" :metadata="metadata.bar_color"/>
      <form-group v-model="wData.settings.font" :metadata="metadata.font"/>
    </div>


    <div slot="HTML" >
      <code-editor v-model="wData" :metadata="{ type: 'html' }"/>
    </div>

    <div slot="CSS" >
      <code-editor v-model="wData" :metadata="{ type: 'css' }"/>
    </div>

    <div slot="JS" >
      <code-editor v-model="wData" :metadata="{ type: 'js' }"/>
    </div>

    <div slot="test" >
      <test-buttons :testers="['Follow', 'Subscription', 'Donation', 'Bits', 'Host']"/>
    </div>


  </widget-window>

</template>

<script lang="ts" src="./StreamBoss.vue.ts"></script>

<style lang="less" scoped>
  .loading-spinner {
    position: relative;
    width: 100%;
    height: 100%;
    padding-top: 100px;

    img {
      position: absolute;
      left: 50%;
      transform: translate(-50%, 0);
    }
  }
</style>
