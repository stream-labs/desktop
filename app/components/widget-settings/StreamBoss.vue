<template>
  <widget-window v-if="wData" v-model="tabName">

    <div slot="description">
      {{ $t('Let your viewers seize the opportunity of becoming a boss in your channel by interacting with the stream. Works with tips, follows, subscriptions and cheers.') }}
    </div>

    <!-- streamboss setup -->
    <div slot="goal" >
      <div v-if="hasGoal">
        <div class="section__body">
          <w-form-group :title="$t('Current Boss Name')">{{ wData.goal.boss_name }}</w-form-group>
          <w-form-group :title="$t('Total Health')">{{ wData.goal.total_health }}</w-form-group>
          <w-form-group :title="$t('Current Health')">{{ wData.goal.current_health }}</w-form-group>
          <w-form-group :title="$t('Mode')">{{ wData.goal.mode }}</w-form-group>
        </div>
      </div>

      <div v-if="!hasGoal">

        <div class="section__body" v-if="loadingState !== 'pending'">

          <w-form ref="form">
            <div class="row">
              <div class="col-xs-12">
                <label>{{ $t("Title") }} *</label>
                <w-text-input v-model="goalCreateOptions.title" :metadata="{required: true, max: 60}"/>
              </div>
            </div>

            <div class="row">
              <div class="col-xs-12">
                <label>{{ $t("Goal Amount") }} *</label>
                <w-number-input v-model="goalCreateOptions.goal_amount" :metadata="{required: true, min: 1}"/>
              </div>
            </div>

            <div class="row">
              <div class="col-xs-12">
                <label>{{ $t("Starting Amount") }} *</label>
                <w-number-input
                    v-model="goalCreateOptions.manual_goal_amount"
                    :metadata="{ required: true, min: 0, max: goalCreateOptions.goal_amount || undefined}"/>
              </div>
            </div>

            <div class="row">
              <div class="col-xs-12">
                <label>{{ $t("End After") }} *</label>
                <w-text-input
                    v-model="goalCreateOptions.ends_at"
                    :metadata="{ required: true, dateFormat: 'MM/DD/YYYY', placeholder:'MM/DD/YYYY'}"/>
              </div>
            </div>


          </w-form>


        </div>
        <div v-else class="loading-spinner">
          <img src="../../../../media/images/loader.svg" />
        </div>
      </div>

    </div>

    <div slot="goal-controls">

      <button
          v-show="!hasStreamBoss"
          @click="saveStreamBoss()"
          class="button button--action"
      >
        {{ $t('Set Stream Boss Health') }}
      </button>
      <button
          class="button button--warn"
          v-show="hasStreamBoss"
          @click="reset()"
      >
        {{ $t("Reset Stream Boss") }}
      </button>
    </div>

    <div slot="settings">
      <w-form-group type="color" title="Background Color" v-model="wData.settings.background_color"/>
      <w-form-group type="color" title="Bar Color" v-model="wData.settings.bar_color"/>
      <w-form-group type="color" title="Bar Background Color" v-model="wData.settings.bar_bg_color"/>
      <w-form-group type="color" title="Text Color" v-model="wData.settings.text_color" :metadata="{ tooltip: textColorTooltip }"/>
      <w-form-group type="color" title="Bar Text Color" v-model="wData.settings.bar_text_color"/>
      <w-form-group
          type="slider"
          title="Bar Thickness"
          v-model="wData.settings.fade_time"
          :metadata="metadata.fade_time"
      />
      <w-form-group type="fontFamily" :value="wData.settings.font"/>
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
