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
          <div class="row">
            <div class="col-xs-12">
              <label>{{ $t("Title") }} *</label>
              <text-input v-model="goalCreateOptions.title" :metadata="{required: true, max: 60}"/>
            </div>
          </div>

          <div class="row">
            <div class="col-xs-12">
              <label>{{ $t("Goal Amount") }} *</label>
              <number-input v-model="goalCreateOptions.goal_amount" :metadata="{required: true, min: 1}"/>
            </div>
          </div>

          <div class="row">
            <div class="col-xs-12">
              <label>{{ $t("Starting Amount") }} *</label>
              <number-input
                  v-model="goalCreateOptions.manual_goal_amount"
                  :metadata="{ required: true, min: 0, max: goalCreateOptions.goal_amount || undefined}"/>
            </div>
          </div>

          <div class="row">
            <div class="col-xs-12">
              <label>{{ $t("End After") }} *</label>
              <text-input
                  v-model="goalCreateOptions.ends_at"
                  :metadata="{ required: true, dateFormat: 'MM/DD/YYYY', placeholder:'MM/DD/YYYY'}"/>
            </div>
          </div>


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
        class="button button--warn"
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
    <form-group type="fontFamily" :value="wData.settings.font"/>
  </div>


  <div slot="HTML" >
    <w-code-editor v-model="wData" :metadata="{ type: 'html' }"/>
  </div>

  <div slot="CSS" >
    <w-code-editor v-model="wData" :metadata="{ type: 'css' }"/>
  </div>

  <div slot="JS" >
    <w-code-editor v-model="wData" :metadata="{ type: 'js' }"/>
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
