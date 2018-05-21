<template>
<modal-layout
  title="Bit Goal Settings"
  :done-handler="submit"
  :cancel-handler="cancel"
>

  <div slot="content">
    <webview :src="widgetUrl"></webview>
    <tabs>
      <!-- goal setup -->
      <tab name="Setup Goal">
        <div class="section__body">
          <div class="row">
            <div class="col-xs-12">
              <label>Title</label>
              <input
                name="title"
                type="text"
                placeholder="September Bit Goal"
                v-model="widgetData.title"
                v-validate="'required|max:60'"
                :class="{'form__input--error' : errors.has('title')}" />
              <span
                v-show="errors.has('title')"
                class="form__error-text">{{ errors.first('title') }}</span>
            </div>
          </div>

          <div class="row">
            <div class="col-xs-12">
              <label>Goal Amount</label>
              <input
                name="goal_amount"
                type="text"
                placeholder="100"
                v-model="widgetData.goal_amount"
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
              <label>Starting Amount</label>
              <input
                name="manual_goal_amount"
                type="text"
                placeholder="0"
                v-model="widgetData.manual_goal_amount"
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
              <label>End After</label>
              <input
                type="text"
                name="ends_at"
                placeholder="MM/DD/YYYY"
                v-model="widgetData.ends_at"
                v-validate="'required|date_format:MM/DD/YYYY'">
              <span
                v-show="errors.has('ends_at')"
                class="form__error-text">
                {{ errors.first('ends_at') }}</span>
            </div>
          </div>
        </div>

        <div class="section__footer text--center">
          <button
            class="button button--action"
            @click.prevent="onGoalSave"
            :class="{'disabled' : this.errors.any() }">
            Start Bit Goal</button>
        </div>
      </tab>

      <tab name="Settings">
        <div class="section__body">
          <div class="row">
            <div class="col-xs-12">
              <!-- <dropdown name="layout" v-model="widgetData.settings.layout" disablesearch="true">
                <option value="standard">Standard</option>
                <option value="condensed">Condensed</option>
              </dropdown> -->

              <w-list-input
                v-model="layout"
                @input="setLayout"
                :internal-search="false"/>
            </div>
          </div>

          <div class="row">
            <div class="col-xs-12">
              <w-color-input v-model="backgroundColorData" />
              <!-- <button @click.prevent="onSuggestClick">Suggest</button> -->
            </div>
          </div>

          <div class="row">
            <div class="col-xs-12">
              <w-color-input v-model="textColorData" />
            </div>
          </div>

          <div class="row">
            <div class="col-xs-12">
              <w-color-input v-model="barTextColorData" />
            </div>
          </div>

          <div class="row">
            <div class="col-xs-12">
              <w-color-input v-model="barColorData" />
            </div>
          </div>

          <div class="row">
            <div class="col-xs-12">
              <w-color-input v-model="barBackgroundColorData" />
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

          <!-- <div class="row">
            <div class="col-xs-12">
              <w-code-editor />
            </div>
          </div> -->

          <!-- <div class="row">
            <div class="col-xs-12">
              <label>Enable Custom HTML/CSS</label>

              <div class="group">
                <div class="radio checkbox-wrapper">
                  <input
                    type="radio"
                    name="custom_enabled"
                    v-model="widgetData.settings.custom_enabled"
                    value="true" />
                  <label>Enabled</label>
                </div>
                <div class="radio checkbox-wrapper">
                  <input
                    type="radio"
                    name="custom_enabled"
                    v-model="widgetData.settings.custom_enabled"
                    value="false" />
                  <label>Disabled</label>
                </div>
              </div>
            </div>
          </div>

          <div v-if="widgetData.settings.custom_enabled == 'true' ||
                widgetData.settings.custom_enabled == true" class="row">
            <tabs>
              <tab name="HTML">
                <div class="code-input-wrapper margin-top--10 margin-bot--10">
                  <codemirror
                    ref="custom_html_editor"
                    v-model="widgetData.settings.custom_html"
                    :options="editorOptionsHTML">
                  </codemirror>
                </div>
              </tab>

              <tab name="CSS">
                <div class="code-input-wrapper margin-top--10 margin-bot--10">
                  <codemirror
                    ref="custom_css_editor"
                    v-model="widgetData.settings.custom_css"
                    :options="editorOptionsCSS">
                  </codemirror>
                </div>
              </tab>

              <tab name="JS">
                <div class="code-input-wrapper margin-top--10 margin-bot--10">
                  <codemirror
                    ref="custom_js_editor"
                    v-model="widgetData.settings.custom_js"
                    :options="editorOptionsJS">
                  </codemirror>
                </div>
                <div class="form__help-text margin-bot--10">
                  Please refresh the widget to see updated changes. Saving custom code can have potential security risks, make sure you trust the code you are about to apply.
                </div>
              </tab>
            </tabs>
          </div> -->
        </div>

        <!-- <div class="section__footer">
          <input
            type="button"
            class="button button--warn"
            @click="resetCustom" value="Reset" />
        </div> -->
      </tab>
    </tabs>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./BitGoal.vue.ts"></script>
