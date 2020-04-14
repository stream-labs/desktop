import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { WidgetsService } from 'services/widgets';
import { Inject } from '../services/core/injector';

@Component({})
export default class TestWidgets extends Vue {
  @Prop() testers: string[];

  @Inject() widgetsService: WidgetsService;

  slideOpen = false;

  get widgetTesters() {
    const allTesters = this.widgetsService.getTesters();
    if (!this.testers) return allTesters;
    return allTesters.filter(tester => this.testers.includes(tester.name));
  }

  test(testerName: string) {
    this.widgetsService.test(testerName);
  }
}
