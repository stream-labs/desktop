<template>
<widget-editor
  v-if="wData"
  ref="layout"
  v-model="wData.settings.custom_enabled"
  :settings="settings"
  :requestState="requestState"
  :loaded="loaded"
>
    <!-- streamboss setup -->
    <div slot="goal-properties" >
      <div v-if="hasGoal">
        <div class="section__body">
          <v-form-group :title="$t('Current Boss Name')">{{ wData.goal.boss_name }}</v-form-group>
          <v-form-group :title="$t('Total Health')">{{ wData.goal.total_health }}</v-form-group>
          <v-form-group :title="$t('Current Health')">{{ wData.goal.current_health }}</v-form-group>
          <v-form-group :title="$t('Mode')">{{ wData.goal.mode }}</v-form-group>
          <button
              class="button button--warn"
              @click="reset()"
          >{{ $t('Reset Stream Boss') }}</button>
        </div>
      </div>

      <div v-else>
        <validated-form ref="form" class="section__body" v-if="requestState !== 'pending'">
          <v-form-group v-model="bossCreateOptions.total_health" :metadata="metadata.total_health"/>
          <v-form-group v-model="bossCreateOptions.mode" :metadata="metadata.mode"/>
        </validated-form>
        <div v-else class="loading-spinner">
          <img src="../../../media/images/loader.svg" />
        </div>
        <button
            @click="saveGoal()"
            class="button button--action"
        >{{ $t('Set Stream Boss Health') }}</button>
      </div>
    </div>

    <div slot="manage-battle-properties">
      <v-form-group v-model="wData.settings.fade_time" :metadata="metadata.fade_time"/>
      <v-form-group>
        <bool-input v-model="wData.settings.boss_heal" :metadata="metadata.boss_heal"/>
      </v-form-group>
      <v-form-group v-model="wData.settings.skin" :metadata="metadata.skin"/>
      <v-form-group v-model="wData.settings.follow_multiplier" :metadata="metadata.follow_multiplier"/>
      <v-form-group v-model="wData.settings.bit_multiplier" :metadata="metadata.bit_multiplier"/>
      <v-form-group v-model="wData.settings.sub_multiplier" :metadata="metadata.sub_multiplier"/>
      <v-form-group v-model="wData.settings.donation_multiplier" :metadata="metadata.donation_multiplier"/>
    </div>

    <div slot="visual-properties">
      <v-form-group v-model="wData.settings.kill_animation" :metadata="metadata.kill_animation"/>
      <v-form-group>
        <bool-input v-model="wData.settings.bg_transparent" :metadata="metadata.bg_transparent"/>
      </v-form-group>
      <v-form-group v-model="wData.settings.background_color" :metadata="metadata.background_color"/>
      <v-form-group v-model="wData.settings.text_color" :metadata="metadata.text_color"/>
      <v-form-group v-model="wData.settings.bar_text_color" :metadata="metadata.bar_text_color"/>
      <v-form-group v-model="wData.settings.bar_color" :metadata="metadata.bar_color"/>
      <v-form-group v-model="wData.settings.font" :metadata="metadata.font"/>
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
  </widget-editor>
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
