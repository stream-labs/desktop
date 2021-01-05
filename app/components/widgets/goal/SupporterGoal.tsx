import { Component } from 'vue-property-decorator';
import GenericGoal from './GenericGoal.vue';
import Vue from 'vue';

@Component({})
export default class SupporterGoal extends Vue {
  render() {
    return <GenericGoal />;
  }
}
