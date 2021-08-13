import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import CommentLocalFilter from './CommentLocalFilter.vue';
import CommentSynthesizer from './CommentSynthesizer.vue';

@Component({
  components: {
    CommentLocalFilter,
    CommentSynthesizer,
  },
})
export default class CommentSettings extends Vue {
  close() {
    this.$emit('close');
  }
}
