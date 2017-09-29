import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { WidgetsService } from '../services/widgets';
import { Inject } from '../util/injector';

@Component({})
export default class TestWidgets extends Vue {

  @Inject()
  widgetsService:WidgetsService;

  slideOpen = false;

  get widgetTesters() {
    return this.widgetsService.getTesters();
  }

}
