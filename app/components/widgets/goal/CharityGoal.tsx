import { Component } from 'vue-property-decorator';
import GenericGoal from './GenericGoal.vue';
import Vue from 'vue';

@Component({})
export default class CharityGoal extends Vue {
  render() {
    return <GenericGoal goalType="charity" />;
  }
}
