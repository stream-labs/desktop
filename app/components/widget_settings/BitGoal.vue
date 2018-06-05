<template>
<modal-layout
  title="Bit Goal Settings"
  :customControls="true"
  :showControls="false">

  <div slot="content">
    <div v-if="bitGoalData">

      <webview :src="widgetUrl"></webview>

      <tabs>
        <!-- goal setup -->
        <tab name="Setup Goal">
          <div v-show="has_goal">
            <div class="section__body">

              <div class="row">
                <div class="small-12 medium-3 column">
                  <label>{{ $t("Title") }}</label>
                </div>
                <div class="small-12 medium-9 columns">
                  <span>{{ bitGoalData.goal.title }}</span>
                </div>
              </div>

              <div class="row">
                <div class="small-12 medium-3 column">
                  <label>{{ $t("Goal Amount") }}</label>
                </div>
                <div class="small-12 medium-9 columns">
                  <span>{{ bitGoalData.goal.amount }}</span>
                </div>
              </div>

              <div class="row">
                <div class="small-12 medium-3 column">
                  <label>{{ $t("Current Amount") }}</label>
                </div>
                <div class="small-12 medium-9 columns">
                  <span>{{ bitGoalData.goal.current_amount }}</span>
                </div>
              </div>

              <div class="row">
                <div class="small-12 medium-3 column">
                  <label>{{ $t("Days Remaining") }}</label>
                </div>
                <div class="small-12 medium-9 columns">
                  <span>{{ bitGoalData.goal.to_go }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-show="!has_goal">
            <div class="section__body">
              <div class="row">
                <div class="col-xs-12">
                  <label>{{ $t("Title") }}</label>
                  <input
                    name="title"
                    type="text"
                    placeholder="September Bit Goal"
                    v-model="bitGoalData.goal.title"
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
                    v-model="bitGoalData.goal.goal_amount"
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
                    v-model="bitGoalData.goal.manual_goal_amount"
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
                    v-model="bitGoalData.goal.ends_at"
                    v-validate="'required|date_format:MM/DD/YYYY'">
                  <span
                    v-show="errors.has('ends_at')"
                    class="form__error-text">
                    {{ errors.first('ends_at') }}</span>
                </div>
              </div>
            </div>
          </div>
        </tab>

        <tab name="Settings">
          <div class="section__body">
            <div class="row">
              <div class="col-xs-12">
                <w-list-input
                  v-model="layout"
                  :internal-search="false"/>
              </div>
            </div>

            <div class="row">
              <div class="col-xs-12">
                <label>Background Color</label>
                <w-color-input
                  :color="bitGoalData.settings.background_color"
                  v-model="bitGoalData.settings.background_color" />
              </div>
            </div>

            <div class="row">
              <div class="col-xs-12">
                <label>Bar Color</label>

                <w-color-input v-model="bitGoalData.settings.bar_color" />
              </div>
            </div>

            <div class="row">
              <div class="col-xs-12">
                <label>Bar Background Color</label>

                <w-color-input v-model="bitGoalData.settings.bar_bg_color" />
              </div>
            </div>

            <div class="row">
              <div class="col-xs-12">
                <label>Text Color</label>

                <w-color-input v-model="bitGoalData.settings.text_color" />
              </div>
            </div>

                        <div class="row">
              <div class="col-xs-12">
                <label>Bar Text Color</label>
                <w-color-input v-model="bitGoalData.settings.bar_text_color" />
              </div>
            </div>

            <div class="row">
              <div class="col-xs-12">
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
              <div class="col-xs-12">
                <w-font-family
                  v-model="fontFamilyData" />
                <!-- <i class="tooltip-trigger fas fa-question-circle" v-tooltip.right='Tooltips.fontFamily'></i> -->
              </div>
            </div>

            <div class="row">
              <div class="col-xs-12">
                <!-- <w-code-editor
                  :settings="bitGoalData.settings"
                  :defaults="bitGoalData.custom_defaults" /> -->
              </div>
            </div>
          </div>

        </tab>
      </tabs>

      <div>
        <button
          class="button button--default"
          @click="cancel">
          Cancel
        </button>
        <button
          class="button button--default"
          @click="onGoalSave">
          Save Goal
        </button>
        <button
          class="button button--default"
          @click="onSettingsSave(bitGoalData)">
          Save Settings
        </button>
        <button
          class="button button--action"
          @click.prevent="onGoalSave(bitGoalData)"
          :class="{'disabled' : this.errors.any() }"
          v-show="!has_goal">
          Start Bit Goal</button>
        <button
          class="button button--warn"
          v-show="has_goal"
          @click="onEndGoal">{{ $t("End Bit Goal") }}</button>
      </div>
    </div>
    <div v-else>loading</div>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./BitGoal.vue.ts"></script>
