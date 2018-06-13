<template>
<modal-layout
  title="Donation Goal Settings"
  :customControls="true"
  :showControls="false">

  <div slot="content">
    <div v-if="widgetData">

      <webview :src="widgetUrl"></webview>

      <tabs>
        <tab name="Setup Goal">
          <div v-show="has_goal">
            <div class="section__body">
              <div class="row">
                <div class="small-12 medium-3 column">
                  <label>{{ $t("Title") }}</label>
                </div>
                <div class="small-12 medium-9 columns">
                  <span>{{ widgetData.goal.title }}</span>
                </div>
              </div>

              <div class="row">
                <div class="small-12 medium-3 column">
                  <label>{{ $t("Goal Amount") }}</label>
                </div>
                <div class="small-12 medium-9 columns">
                  <span>{{ widgetData.goal.amount }}</span>
                </div>
              </div>

              <div class="row">
                <div class="small-12 medium-3 column">
                  <label>{{ $t("Current Amount") }}</label>
                </div>
                <div class="small-12 medium-9 columns">
                  <span>{{ widgetData.goal.current_amount }}</span>
                </div>
              </div>

              <div class="row">
                <div class="small-12 medium-3 column">
                  <label>{{ $t("Days Remaining") }}</label>
                </div>
                <div class="small-12 medium-9 columns">
                  <span>{{ widgetData.goal.to_go }}</span>
                </div>
              </div>

            </div>
            <div class="section__footer text--center">
              <button
                class="button button--warn"
                @click="onEndGoal">
                {{ $t("End Donation Goal") }}
              </button>
            </div>
          </div>

          <div v-show="!has_goal">
            <input type="hidden" name="action" value="start-donation-goal" />
            <div class="section__body">
              <div class="row">
                <div class="small-12 medium-3 column">
                  <label>{{ $t("Title") }}</label>
                </div>
                <div class="small-12 medium-9 columns">
                  <input
                    name="title"
                    type="text"
                    placeholder="Sept. Phone Bill"
                    v-model="widgetData.goal.title"
                    v-validate="'required|max:60'"
                    :class="{'form__error-text' : errors.has('title')}" />
                  <span
                    v-show="errors.has('title')"
                    class="form__error-text">
                    {{ errors.first('title') }}
                  </span>
                </div>
              </div>

              <div class="row">
                <div class="small-12 medium-3 column">
                  <label>{{ $t("Goal Amount") }}</label>
                </div>
                <div class="small-12 medium-9 columns">
                  <input
                    name="goal_amount"
                    type="text"
                    placeholder="100.00"
                    v-model="widgetData.goal.goal_amount"
                    v-validate="'required|decimal:2'"
                    :class="{'form-error' : errors.has('goal_amount')}"/>
                  <span
                    v-show="errors.has('goal_amount')"
                    class="form__error-text">
                    {{ errors.first('goal_amount') }}
                  </span>
                </div>
              </div>

              <div class="row">
                <div class="small-12 medium-3 column">
                  <label>{{ $t("Starting Amount") }}</label>
                </div>
                <div class="small-12 medium-9 columns">
                  <input
                    name="manual_goal_amount"
                    type="text"
                    placeholder="0.00"
                    v-model="widgetData.goal.manual_goal_amount"
                    v-validate="'required|decimal:2'"
                    :class="{'form-error' : errors.has('manual_goal_amount')}"/>
                  <span v-show="errors.has('manual_goal_amount')" class="error-text">{{ errors.first('manual_goal_amount') }}</span>
                </div>
              </div>

              <div class="row">
                <div class="small-12 medium-3 column">
                  <label>{{ $t("End After") }}</label>
                </div>
                <div class="small-12 medium-9 columns">
                  <input
                    type="text"
                    name="ends_at"
                    placeholder="MM/DD/YYYY"
                    v-model="widgetData.goal.ends_at"
                    v-validate="'required|date_format:MM/DD/YYYY'">
                  <span
                    v-show="errors.has('ends_at')"
                    class="error-text">{{ errors.first('ends_at') }}</span>
                </div>
              </div>
            </div>
            <div class="section__footer text--center">
              <button
                class="button button--action"
                @click.prevent="onGoalSave"
                :class="{ 'disabled' : this.errors.any() }">
                {{ $t("Start Donation Goal") }}</button>
            </div>
          </div>
        </tab>

        <tab name="Settings">
          <div class="section__body">

            <div class="row">
              <div class="small-12 columns">
                <w-list-input
                  v-model="layoutData"
                  :internal-search="false"/>
              </div>
            </div>

            <div class="row">
              <div class="col-xs-12">
                <label>Background Color</label>
                <w-color-input
                  name="background_color"
                  v-model="widgetData.settings.background_color" />
              </div>
            </div>

            <div class="row">
              <div class="col-xs-12">
                <label>Bar Color</label>
                <w-color-input
                  name="bar_color"
                  v-model="widgetData.settings.bar_color" />
              </div>
            </div>

            <div class="row">
              <div class="col-xs-12">
                <label>Bar Background Color</label>
                <w-color-input
                  name="bar_bg_color"
                  v-model="widgetData.settings.bar_bg_color" />
              </div>
            </div>

            <div class="row">
              <div class="col-xs-12">
                <label>Text Color</label>
                <w-color-input
                  name="text_color"
                  v-model="widgetData.settings.text_color" />
              </div>
            </div>

            <div class="row">
              <div class="col-xs-12">
                <label>Bar Text Color</label>
                <w-color-input
                  name="bar_text_color"
                  v-model="widgetData.settings.bar_text_color" />
              </div>
            </div>

            <div class="row">
              <div class="small-12 columns">
                <w-slider
                  name="bar_thickness"
                  v-model="barThicknessData"
                  :min="32"
                  :max="128"
                  :steps="4"
                  suffix="px" />
              </div>
            </div>

            <div class="row">
              <div class="small-12 columns">
                <w-font-family
                  v-model="fontFamilyData" />
              </div>
            </div>

          </div>

          <div class="section__footer text--center">
            <button
              class="button button--action"
              @click.prevent="onSettingsSave">{{ $t("Save Settings") }}</button>
          </div>

        </tab>
      </tabs>
    </div>
    <div v-else>
      <img src="../../../media/images/loader.svg" />
    </div>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./DonationGoal.vue.ts"></script>
