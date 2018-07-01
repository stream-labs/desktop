<template id="customcode__template">
  <div>
    <div class="row">
      <div class="small-12 medium-3 columns">
        <label>Enable Custom HTML/CSS</label>
      </div>
      <div class="small-12 medium-9 columns">
        <div class="group">
          <div class="radio checkbox-wrapper">
            <input
              type="radio"
              name="custom_enabled"
              v-model="settings.custom_enabled"
              value="true"
              @click="showEditor()" />
            <label>Enabled</label>
          </div>
          <div class="radio checkbox-wrapper">
            <input
              type="radio"
              name="custom_enabled"
              v-model="settings.custom_enabled"
              value="false" />
            <label>Disabled</label>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="settings.custom_enabled == 'true' || settings.custom_enabled == true"
      class="row">
      <tabs>
        <tab name="HTML">
          <div class="code-input-wrapper">
            <codemirror
              ref="custom_html_editor"
              v-model="settings.custom_html"
              :options="editorOptionsHTML">
            </codemirror>
          </div>
        </tab>
        <tab name="CSS">
          <div class="code-input-wrapper">
            <codemirror
              ref="custom_css_editor"
              v-model="settings.custom_css"
              :options="editorOptionsCSS">
            </codemirror>
          </div>
        </tab>
        <tab name="JS">
          <div class="code-input-wrapper" v-if="editCustomFields == true">
            <codemirror
              v-model="customEditableJson"
              :options="editorOptionsJS">
            </codemirror>
          </div>
        </tab>
        <tab
          name="Custom Fields"
          v-if="settings.custom_json && editCustomFields === false">
          <div class="section__body">
            <div class="row" v-for="(child, name) in settings.custom_json">
              <div class="small-12 medium-3 columns">
                <label>{{ child.label }}</label>
              </div>
              <div class="small-12 medium-9 columns">
                <component
                  :is="child.type"
                  :key="child.type"
                  v-model="settings.custom_json[name].value"
                  :max="child.max"
                  :min="child.min"
                  :steps="child.steps"
                  :options="child.options"></component>
              </div>
            </div>
          </div>
        </tab>
        <tab
          name="Custom Fields Editor"
          v-if="settings.custom_json && editCustomFields === true">
          <div class="code-input-wrapper" v-if="editCustomFields == true">
            <codemirror
              v-model="customEditableJson"
              :options="editorOptionsJS">
            </codemirror>
          </div>
        </tab>
      </tabs>

      <div class="flex">
        <div>
          <input
            type="button"
            class="button button--warn"
            value="Reset Code"
            @click="resetCode" />
          <!-- shows if custom fields are enabled -->
          <input
            type="button"
            class="button button--warn"
            @click="removeCustomFields()"
            value="Remove Custom Fields"
            v-if="settings.custom_json && (custom_code_view == 'json' || custom_code_view == 'json_editor')" />
        </div>

        <div>
          <!-- shows if custom fields are not enabled -->
          <input
            type="button"
            class="button button--default"
            @click="addCustomFields()"
            value="Add Custom Fields"
            v-if="!settings.custom_json" />

          <!-- shows if custom fields are enabled and fields view is active -->
          <input
            type="button"
            class="button button--default"
            @click="showEditCustomFields()"
            value="Edit Custom Fields"
            v-if="settings.custom_json && editCustomFields == false && (custom_code_view == 'json')" />

          <!-- shows if custom fields are enabled and fields editor is active -->
          <input
            type="button"
            class="button button--default"
            @click="onCustomJSONUpdate"
            value="Update"
            v-if="settings.custom_json && editCustomFields == true && (custom_code_view == 'json_editor')" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./WCodeEditor.vue.ts"></script>