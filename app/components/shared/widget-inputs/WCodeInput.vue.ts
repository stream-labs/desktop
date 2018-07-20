import { Component, Prop } from 'vue-property-decorator';
import { codemirror } from 'vue-codemirror';
import { IWInputMetadata, WInput } from './WInput';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/mode/css/css.js';
import 'codemirror/mode/htmlmixed/htmlmixed.js';
import 'codemirror/keymap/sublime';


@Component({
  components: { codemirror }
})
export default class WCodeInput extends WInput<string, IWInputMetadata> {

  @Prop({ default: '' })
  value: string;

  @Prop({ default: () => ({ type: 'html' }) })
  metadata: IWInputMetadata;

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

}
