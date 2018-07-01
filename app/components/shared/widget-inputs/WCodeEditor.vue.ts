import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { codemirror } from 'vue-codemirror';
// codemirror has required styles that are imported in index.less


@Component({
  components: { codemirror }
})
export default class CodeEditorInput extends Vue{
  @Prop()
  settings: {
    custom_html: '',
    custom_css: '',
    custom_js: '',
    custom_json: null,
  };
  defaults: {
    html: '',
    css: '',
    js: ''
  };

  editorOptionsHTML: {
    // codemirror options
    mode: 'htmlmixed',
    keyMap: 'sublime',
    lineNumbers: true,
    autofocus: true,
    tabSize: 2,
    theme: 'material',
    autoRefresh: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    autoCloseTags: true,
    extraKeys: {
      'Tab': 'emmetExpandAbbreviation',
      'Enter': 'emmetInsertLineBreak'
    }
  };

  editorOptionsCSS: {
    // codemirror options
    mode: 'text/css',
    keyMap: 'sublime',
    lineNumbers: true,
    autofocus: true,
    tabSize: 2,
    theme: 'material',
    autoRefresh: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    autoCloseTags: true,
    extraKeys: {
      'Tab': 'emmetExpandAbbreviation',
      'Enter': 'emmetInsertLineBreak'
    }
  };

  editorOptionsJS: {
    // codemirror options
    mode: 'javascript',
    keyMap: 'sublime',
    lineNumbers: true,
    autofocus: true,
    tabSize: 2,
    theme: 'material',
    autoRefresh: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    autoCloseTags: true,
  };

  custom_code_view = 'html';
  editCustomFields = false;
  customEditableJson = '';

  showEditor() {
    this.settings.custom_html = this.settings.custom_html || this.defaults.html;
    this.settings.custom_js = this.settings.custom_js || this.defaults.js;
    this.settings.custom_css = this.settings.custom_css || this.defaults.css;
  }

  resetCode() {
    this.settings.custom_html = this.defaults.html;
    this.settings.custom_js = this.defaults.js;
    this.settings.custom_css = this.defaults.css;
    this.settings.custom_json = null;
    this.custom_code_view = 'html';
  }

  showEditCustomFields() {
    this.customEditableJson = JSON.stringify(this.settings.custom_json, null, 4);
    this.editCustomFields = true;
    this.custom_code_view = 'json_editor';
  }

  onCustomJSONUpdate(value: string) {
    this.settings.custom_json = JSON.parse(this.customEditableJson);
    this.editCustomFields = false;
    this.custom_code_view = 'json';
  }

  removeCustomFields() {
    this.settings.custom_json = null;
    this.custom_code_view = 'html';
  }

  addCustomFields() {
    this.settings.custom_json = JSON.parse('{"customField1":{"label":"Color Picker Example","type":"colorpicker","value":"#000EF0"},"customField2":{"label":"Slider Example","type":"slider","name":"","value":"3","max":200,"min":100,"steps":4},"customField3":{"label":"Textfield Example","type":"textfield","value":"Hi There"},"customField4":{"label":"Font Picker Example","type":"fontpicker","value":"Open Sans"},"customField5":{"label":"Dropdown Example","type":"dropdown","options": {"optionA": "Option A","optionB": "Option B","optionC": "Option C"},"value": "optionB"}}');
    this.custom_code_view = 'json';
  }
}
