import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { WidgetsService } from 'services/widgets';
import { FacemasksService } from 'services/facemasks';
import { Inject } from '../../services/core/injector';

@Component({})
export default class TestButtons extends Vue {
  @Inject() private widgetsService: WidgetsService;
  @Inject() private facemasksService: FacemasksService;

  @Prop() testers: string[];

  get widgetTesters() {
    const availableTesters = this.widgetsService.getTesters();
    return this.testers
      ? availableTesters.filter(tester => this.testers.includes(tester.name))
      : availableTesters;
  }

  test(testerName: string) {
    this.widgetsService.test(testerName);
  }
}
