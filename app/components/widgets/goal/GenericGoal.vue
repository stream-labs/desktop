<template>
<widget-editor :navItems="navItems">
  <!-- goal setup -->
  <validated-form slot="goal-properties" v-if="loaded">
    <div v-if="hasGoal">
      <div class="section__body">
        <div class="goal-row"><span>{{ $t('Title') }}</span><span>{{ wData.goal.title }}</span></div>
        <div class="goal-row"><span>{{ $t('Goal Amount') }}</span><span>{{ wData.goal.amount }}</span></div>
        <div class="goal-row"><span>{{ $t('Current Amount') }}</span><span>{{ wData.goal.current_amount }}</span></div>
        <div class="goal-row"><span>{{ $t('Days Remaining') }}</span><span>{{ wData.goal.to_go }}</span></div>
        <button class="button button--soft-warning" @click="resetGoal()">{{ $t("End Goal") }}</button>
      </div>
    </div>

    <div v-else>
      <div class="section__body" v-if="requestState !== 'pending'">
        <validated-form ref="form" name="new-goal-form">
          <v-form-group v-model="goalCreateOptions.title" :metadata="metadata.title"/>
          <v-form-group v-model="goalCreateOptions.goal_amount" :metadata="metadata.goal_amount"/>
          <v-form-group v-model="goalCreateOptions.manual_goal_amount" :metadata="metadata.manual_goal_amount"/>
          <v-form-group v-model="goalCreateOptions.ends_at" :metadata="metadata.ends_at"/>
        </validated-form>
        <button @click="saveGoal()" class="button button--action">{{ $t('Start Goal') }}</button>
      </div>
      <div v-else class="loading-spinner">
        <img src="../../../../media/images/loader.svg" />
      </div>
    </div>
  </validated-form>

  <validated-form slot="visual-properties" name="visual-properties-form" v-if="loaded" @input="save()">
    <v-form-group v-if="goalType === 'sub'" v-model="wData.settings.include_resubs" :metadata="metadata.include_resubs" />
    <v-form-group v-model="wData.settings.layout" :metadata="metadata.layout"/>
    <v-form-group v-model="wData.settings.background_color" :metadata="metadata.background_color"/>
    <v-form-group v-model="wData.settings.bar_color" :metadata="metadata.bar_color"/>
    <v-form-group v-model="wData.settings.bar_bg_color" :metadata="metadata.bar_bg_color"/>
    <v-form-group v-model="wData.settings.text_color" :metadata="metadata.text_color"/>
    <v-form-group v-model="wData.settings.bar_text_color" :metadata="metadata.bar_text_color"/>
    <v-form-group v-model="wData.settings.bar_thickness" :metadata="metadata.bar_thickness"/>
    <v-form-group v-model="wData.settings.font" :metadata="metadata.font"/>
  </validated-form>


</widget-editor>

</template>

<script lang="ts" src="./GenericGoal.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";

.goal-row {
  .padding();

  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
}

.goal-row:last-of-type {
  .margin-bottom();
}

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
