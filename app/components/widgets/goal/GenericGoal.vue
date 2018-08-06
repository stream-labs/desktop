<template>
<widget-window v-if="wData" v-model="tabName">

  <div slot="description">{{ $t('Set a goal for your viewers to help you reach below.') }}</div>

  <!-- goal setup -->
  <div slot="goal" >
    <div v-if="hasGoal">
      <div class="section__body">
        <form-group :title="$t('Title')">{{ wData.goal.title }}</form-group>
        <form-group :title="$t('Goal Amount')">{{ wData.goal.amount }}</form-group>
        <form-group :title="$t('Current Amount')">{{ wData.goal.current_amount }}</form-group>
        <form-group :title="$t('Days Remaining')">{{ wData.goal.to_go }}</form-group>
      </div>
    </div>

    <div v-if="!hasGoal">

      <div class="section__body" v-if="loadingState !== 'pending'">

        <validated-form ref="form">
          <form-group v-model="goalCreateOptions.title" :metadata="metadata.title"/>
          <form-group v-model="goalCreateOptions.goal_amount" :metadata="metadata.goal_amount"/>
          <form-group v-model="goalCreateOptions.manual_goal_amount" :metadata="metadata.manual_goal_amount"/>
          <form-group v-model="goalCreateOptions.ends_at" :metadata="metadata.ends_at"/>
        </validated-form>

      </div>
      <div v-else class="loading-spinner">
        <img src="../../../../media/images/loader.svg" />
      </div>
    </div>

  </div>

  <div slot="goal-controls">

    <button
        v-show="!hasGoal"
        @click="saveGoal()"
        class="button button--action"
    >
      {{ $t('Start Goal') }}
    </button>
    <button
        class="button button--soft-warning"
        v-show="hasGoal"
        @click="reset()"
    >
      {{ $t("End Goal") }}
    </button>
  </div>

  <div slot="settings">
    <form-group type="list" title="Layout" v-model="wData.settings.layout" :metadata="metadata.layout"/>
    <form-group type="color" title="Background Color" v-model="wData.settings.background_color"/>
    <form-group type="color" title="Bar Color" v-model="wData.settings.bar_color"/>
    <form-group type="color" title="Bar Background Color" v-model="wData.settings.bar_bg_color"/>
    <form-group type="color" title="Text Color" v-model="wData.settings.text_color" :metadata="{ tooltip: textColorTooltip }"/>
    <form-group type="color" title="Bar Text Color" v-model="wData.settings.bar_text_color"/>
    <form-group
        type="slider"
        title="Bar Thickness"
        v-model="wData.settings.bar_thickness"
        :metadata="metadata.bar_thickness"
    />
    <form-group type="fontFamily" :value="wData.settings.font" :metadata="{ tooltip: fontFamilyTooltip }" />
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


</widget-window>

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
