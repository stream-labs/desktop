import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { WidgetsService } from 'services/widgets';
import { FacemasksService } from 'services/facemasks';
import { Inject } from '../util/injector';

@Component({})
export default class TestWidgets extends Vue {

  @Prop() testers: string[];

  @Inject() widgetsService: WidgetsService;
  @Inject() facemasksService: FacemasksService;

  slideOpen = false;

  get widgetTesters() {
    let allTesters =  this.widgetsService.getTesters();
    if (!this.facemasksActive) {
      allTesters = allTesters.filter((tester) => tester.name !== 'Mask');
    }
    if(!this.testers) return allTesters;
    return allTesters.filter((tester) => this.testers.includes(tester.name))
  }

  get facemasksActive() {
    return this.facemasksService.active;
  }
}
