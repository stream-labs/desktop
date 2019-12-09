import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import Editor from 'components/pages/editor/Editor';

@Component({})
export default class Studio extends Vue {
  render() {
    return <Editor />;
  }
}
