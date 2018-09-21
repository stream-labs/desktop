<template>
<widget-editor
  v-if="wData"
  ref="layout"
  v-model="wData.settings.custom_enabled"
  :settings="settings"
  :requestState="requestState"
  :loaded="loaded"
>
  <!-- goal setup -->
  <div slot="goal-properties" >
    <div v-if="hasGoal">
      <div class="section__body">
        <v-form-group :title="$t('Title')">{{ wData.goal.title }}</v-form-group>
        <v-form-group :title="$t('Goal Amount')">{{ wData.goal.amount }}</v-form-group>
        <v-form-group :title="$t('Current Amount')">{{ wData.goal.current_amount }}</v-form-group>
        <v-form-group :title="$t('Days Remaining')">{{ wData.goal.to_go }}</v-form-group>
        <button class="button button--soft-warning" @click="reset()">{{ $t("End Goal") }}</button>
      </div>
    </div>

    <div v-else>
      <div class="section__body" v-if="requestState !== 'pending'">
        <validated-form ref="form">
          <v-form-group v-model="goalCreateOptions.title" :metadata="metadata.title"/>
          <v-form-group v-model="goalCreateOptions.goal_amount" :metadata="metadata.goal_amount"/>
          <v-form-group v-model="goalCreateOptions.manual_goal_amount" :metadata="metadata.manual_goal_amount"/>
          <v-form-group v-model="goalCreateOptions.ends_at" :metadata="metadata.ends_at"/>
        </validated-form>
      </div>
      <div v-else class="loading-spinner">
        <img src="../../../../media/images/loader.svg" />
      </div>
      <button @click="saveGoal()" class="button button--action">{{ $t('Start Goal') }}</button>
    </div>
  </div>


  <div slot="visual-properties">
    <v-form-group type="list" title="Layout" v-model="wData.settings.layout" :metadata="metadata.layout"/>
    <v-form-group type="color" title="Background Color" v-model="wData.settings.background_color"/>
    <v-form-group type="color" title="Bar Color" v-model="wData.settings.bar_color"/>
    <v-form-group type="color" title="Bar Background Color" v-model="wData.settings.bar_bg_color"/>
    <v-form-group type="color" title="Text Color" v-model="wData.settings.text_color" :metadata="{ tooltip: textColorTooltip }"/>
    <v-form-group type="color" title="Bar Text Color" v-model="wData.settings.bar_text_color"/>
    <v-form-group
        type="slider"
        title="Bar Thickness"
        v-model="wData.settings.bar_thickness"
        :metadata="metadata.bar_thickness"
    />
    <v-form-group type="fontFamily" :value="wData.settings.font" :metadata="{ tooltip: fontFamilyTooltip }" />
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

  <div slot="customFields" >
    <custom-fields-editor :value="wData"/>
  </div>


</widget-editor>

</template>

<script lang="ts" src="./GenericGoal.vue.ts"></script>

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
