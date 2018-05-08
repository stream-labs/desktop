<template>
<modal-layout
  title="Bit Goal Settings"
  :done-handler="submit"
  :cancel-handler="cancel"
>

  <div slot="content">
    <tabs>
      <!-- goal setup -->
      <tab name="Setup Goal">
        <div class="section__body">
          <div class="row">
            <div class="col-xs-12 col-md-3">
              <label>Title</label>
            </div>
            <div class="col-xs-12 col-md-3">
              <input class="width--75" name="title" type="text" placeholder="Sept. Bit Goal" v-model="data.title" v-validate data-vv-rules="required|max:60" data-vv-as="title" :class="{'form-error' : errors.has('title')}" />
              <span v-show="errors.has('title')" class="error-text">{{ errors.first('title') }}</span>
            </div>
          </div>

          <div class="row">
            <div class="col-xs-12 col-md-3">
              <label>Goal Amount</label>
            </div>
            <div class="col-xs-12 col-md-3">
              <input class="width--50" name="goal_amount" type="text" placeholder="100" v-model="data.goal_amount" v-validate data-vv-rules="required" data-vv-as="goal amount" :class="{'form-error' : errors.has('goal_amount')}" />
              <span v-show="errors.has('goal_amount')" class="error-text">{{ errors.first('goal_amount') }}</span>
            </div>
          </div>

          <div class="row">
            <div class="col-xs-12 col-md-3">
              <label>Starting Amount</label>
            </div>
            <div class="col-xs-12 col-md-3">
              <input class="width--50" name="manual_goal_amount" type="text" placeholder="0" v-model="data.manual_goal_amount" v-validate data-vv-rules="required" data-vv-as="starting goal amount" :class="{'form-error' : errors.has('manual_goal_amount')}" />
              <span v-show="errors.has('manual_goal_amount')" class="error-text">{{ errors.first('manual_goal_amount') }}</span>
            </div>
          </div>

          <div class="row">
            <div class="col-xs-12 col-md-3">
              <label>End After</label>
            </div>
            <div class="col-xs-12 col-md-3">
              <input type="text" class="width--50" name="ends_at" placeholder="MM/DD/YYYY" v-model="data.ends_at" v-validate data-vv-as="date" data-vv-rules="required|date_format:MM/DD/YYYY">
              <span v-show="errors.has('ends_at')" class="error-text">{{ errors.first('ends_at') }}</span>
            </div>
          </div>
        </div>

        <div class="section__footer text--center">
          <button class="button button--action" @click.prevent="onGoalSave" :class="{
                'disabled' : this.errors.any() }">
            Start Bit Goal</button>
        </div>
      </tab>

      <tab name="Settings">
        <div class="section__body">
          <div class="row">
            <div class="col-xs-12 col-md-3">
              <label>Layout</label>
            </div>
            <div class="col-xs-12 col-md-9">
              <dropdown name="layout" v-model="settings.layout" disablesearch="true">
                <option value="standard">Standard</option>
                <option value="condensed">Condensed</option>
              </dropdown>
            </div>
          </div>

          <div class="row">
            <div class="col-xs-12 col-md-3">
              <label>Background Color</label>
            </div>
            <div class="col-xs-12 col-md-9">
              <colorpicker name="background_color" v-model="settings.background_color"></colorpicker>
              <button @click.prevent="onSuggestClick" class="small grey">Suggest</button>
            </div>
          </div>

          <div class="row">
            <div class="col-xs-12 col-md-3">
              <label>Text Color</label>
            </div>
            <div class="col-xs-12 col-md-9">
              <colorpicker name="text_color" v-model="settings.text_color"></colorpicker>
            </div>
          </div>

          <div class="row">
            <div class="col-xs-12 col-md-3">
              <label>Bar Text Color</label>
            </div>
            <div class="col-xs-12 col-md-9">
              <colorpicker name="bar_text_color" v-model="settings.bar_text_color"></colorpicker>
            </div>
          </div>

          <div class="row">
            <div class="col-xs-12 col-md-3">
              <label>Bar Color</label>
            </div>
            <div class="col-xs-12 col-md-9">
              <colorpicker name="bar_color" v-model="settings.bar_color"></colorpicker>
            </div>
          </div>

          <div class="row">
            <div class="col-xs-12 col-md-3">
              <label>Bar Background Color</label>
            </div>
            <div class="col-xs-12 col-md-9">
              <colorpicker name="bar_bg_color" v-model="settings.bar_bg_color"></colorpicker>
            </div>
          </div>

          <div class="row">
            <div class="col-xs-12 col-md-3">
              <label>Bar Thickness</label>
            </div>
            <div class="col-xs-12 col-md-9">
              <slider name="bar_thickness" v-model="settings.bar_thickness" :min="32" :max="128" :steps="4" suffix="px"></slider>
            </div>
          </div>

          <div class="row">
            <div class="col-xs-12 col-md-3">
              <label>Font</label>
            </div>
            <div class="col-xs-12 col-md-9">
              <font-input class="google-font-validate" name="font" v-model="settings.font"></font-input>

              <!--<i class="tooltip-trigger fas fa-question-circle" v-tooltip.right='Tooltips.fontFamily'></i>-->
            </div>
          </div>

          <div class="row">
            <div class="col-xs-12 col-md-3">
              <label>Enable Custom HTML/CSS</label>
            </div>
            <div class="col-xs-12 col-md-9">
              <div class="group">
                <div class="radio checkbox-wrapper">
                  <input type="radio" name="custom_enabled" v-model="settings.custom_enabled" value="true" />
                  <label>Enabled</label>
                </div>
                <div class="radio checkbox-wrapper">
                  <input type="radio" name="custom_enabled" v-model="settings.custom_enabled" value="false" />
                  <label>Disabled</label>
                </div>
              </div>
            </div>
          </div>

          <div v-if="settings.custom_enabled == 'true' ||
                settings.custom_enabled == true" class="row">
            <tabs>
              <tab name="HTML">
                <div class="code-input-wrapper margin-top--10 margin-bot--10">
                  <codemirror ref="custom_html_editor" v-model="settings.custom_html" :options="editorOptionsHTML">
                  </codemirror>
                </div>
              </tab>

              <tab name="CSS">
                <div class="code-input-wrapper margin-top--10 margin-bot--10">
                  <codemirror ref="custom_css_editor" v-model="settings.custom_css" :options="editorOptionsCSS">
                  </codemirror>
                </div>
              </tab>

              <tab name="JS">
                <div class="code-input-wrapper margin-top--10 margin-bot--10">
                  <codemirror ref="custom_js_editor" v-model="settings.custom_js" :options="editorOptionsJS">
                  </codemirror>
                </div>
                <div class="form__help-text margin-bot--10">
                  Please refresh the widget to see updated changes. Saving custom code can have potential security risks, make sure you trust the code you are about to apply.
                </div>
              </tab>
            </tabs>
          </div>
        </div>

        <div class="section__footer">
          <input type="button" class="button button--warn" @click="resetCustom" value="Reset"> </input>
        </div>
      </tab>
    </tabs>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./BitGoal.vue.ts"></script>
