import { Component, Prop } from 'vue-property-decorator';
import { codemirror } from 'vue-codemirror';
import { WInput } from './WInput';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/mode/css/css.js';
import 'codemirror/mode/htmlmixed/htmlmixed.js';
import 'codemirror/keymap/sublime';

export interface IWCodeInputMetadata {
  type: string;
}

@Component({
  components: { codemirror }
})
export default class WCodeInput extends WInput<string, IWCodeInputMetadata> {

  @Prop({ default: '' })
  value: string;

  @Prop({ default: () => ({ type: 'html' }) })
  metadata: IWCodeInputMetadata;

  // codemirror options
  editorOptions = {
    html: {
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
        Tab: 'emmetExpandAbbreviation',
        Enter: 'emmetInsertLineBreak'
      }
    },

    css: {
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
        Tab: 'emmetExpandAbbreviation',
        Enter: 'emmetInsertLineBreak'
      }
    },

    js: {
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
    }

  };

  reset() {

  }


  // addCustomFields() {
  //   this.settings.custom_json = JSON.parse('{"customField1":{"label":"Color Picker Example","type":"colorpicker","value":"#000EF0"},"customField2":{"label":"Slider Example","type":"slider","name":"","value":"3","max":200,"min":100,"steps":4},"customField3":{"label":"Textfield Example","type":"textfield","value":"Hi There"},"customField4":{"label":"Font Picker Example","type":"fontpicker","value":"Open Sans"},"customField5":{"label":"Dropdown Example","type":"dropdown","options": {"optionA": "Option A","optionB": "Option B","optionC": "Option C"},"value": "optionB"}}');
  //   this.custom_code_view = 'json';
  // }
}
