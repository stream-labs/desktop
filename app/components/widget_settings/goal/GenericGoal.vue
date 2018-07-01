<template>
<widget-layout v-if="wData" v-model="tabName">


  <!-- goal setup -->
  <div slot="goal" >
    <div v-show="hasGoal">
      <div class="section__body">

        <div class="row">
          <div class="small-12 medium-3 column">
            <label>{{ $t("Title") }}</label>
          </div>
          <div class="small-12 medium-9 columns">
            <span>{{ wData.goal.title }}</span>
          </div>
        </div>

        <div class="row">
          <div class="small-12 medium-3 column">
            <label>{{ $t("Goal Amount") }}</label>
          </div>
          <div class="small-12 medium-9 columns">
            <span>{{ wData.goal.amount }}</span>
          </div>
        </div>

        <div class="row">
          <div class="small-12 medium-3 column">
            <label>{{ $t("Current Amount") }}</label>
          </div>
          <div class="small-12 medium-9 columns">
            <span>{{ wData.goal.current_amount }}</span>
          </div>
        </div>

        <div class="row">
          <div class="small-12 medium-3 column">
            <label>{{ $t("Days Remaining") }}</label>
          </div>
          <div class="small-12 medium-9 columns">
            <span>{{ wData.goal.to_go }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-show="!hasGoal">
      <div class="section__body" v-if="loadingState !== 'pending'">
        <div class="row">
          <div class="col-xs-12">
            <label>{{ $t("Title") }}</label>
            <input
              name="title"
              type="text"
              placeholder="September Bit Goal"
              v-model="wData.goal.title"
              v-validate="'required|max:60'"
              :class="{'form__input--error' : errors.has('title')}" />
            <span
              v-show="errors.has('title')"
              class="form__error-text">{{ errors.first('title') }}</span>
          </div>
        </div>

        <div class="row">
          <div class="col-xs-12">
            <label>{{ $t("Goal Amount") }}</label>
            <input
              name="goal_amount"
              type="text"
              placeholder="100"
              v-model="wData.goal.goal_amount"
              v-validate="'required'"
              :class="{'form__input--error' : errors.has('goal_amount')}" />
            <span
              v-show="errors.has('goal_amount')"
              class="form__error-text">
              {{ errors.first('goal_amount') }}</span>
          </div>
        </div>

        <div class="row">
          <div class="col-xs-12">
            <label>{{ $t("Starting Amount") }}</label>
            <input
              name="manual_goal_amount"
              type="text"
              placeholder="0"
              v-model="wData.goal.manual_goal_amount"
              v-validate="'required'"
              :class="{'form__input--error' : errors.has('manual_goal_amount')}" />
            <span
              v-show="errors.has('manual_goal_amount')"
              class="form__error-text">
              {{ errors.first('manual_goal_amount') }}</span>
          </div>
        </div>

        <div class="row">
          <div class="col-xs-12">
            <label>{{ $t("End After") }}</label>
            <input
              type="text"
              name="ends_at"
              placeholder="MM/DD/YYYY"
              v-model="wData.goal.ends_at"
              v-validate="'required|date_format:MM/DD/YYYY'">
            <span
              v-show="errors.has('ends_at')"
              class="form__error-text">
              {{ errors.first('ends_at') }}</span>
          </div>
        </div>
      </div>
      <div v-else>
        <img src="../../../../media/images/loader.svg" />
      </div>
    </div>

  </div>

  <div slot="goal-controls">

    <button
        class="button button--action"
        @click.prevent="save()"
        :class="{'disabled' : this.errors.any() }"
        v-show="!hasGoal">
      {{ $t("Start Goal") }}
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
    <w-form-group type="list" title="Layout" v-model="wData.settings.layout" :metadata="metadata.layout"/>
    <w-form-group type="color" title="Background Color" v-model="wData.settings.background_color"/>
    <w-form-group type="color" title="Bar Color" v-model="wData.settings.bar_color"/>
    <w-form-group type="color" title="Bar Background Color" v-model="wData.settings.bar_bg_color"/>
    <w-form-group type="color" title="Text Color" v-model="wData.settings.text_color"/>
    <w-form-group type="color" title="Bar Text Color" v-model="wData.settings.bar_text_color"/>
    <w-form-group
        type="slider"
        title="Bar Thickness"
        v-model="wData.settings.bar_thickness"
        :metadata="metadata.bar_thickness"
    />
    <w-form-group type="fontFamily" :value="wData.settings.font"/>
  </div>

</widget-layout>

</template>

<script lang="ts" src="./GenericGoal.vue.ts"></script>
