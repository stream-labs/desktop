import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import CommentLocalFilter from './CommentLocalFilter.vue';

@Component({
  components: {
    CommentLocalFilter,
  },
})
export default class CommentSettings extends Vue {
  close() {
    this.$emit('close');
  }
}
