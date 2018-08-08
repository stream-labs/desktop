import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { QuestionaireService } from '../../services/questionaire';
import { Inject } from '../../util/injector';

@Component({})

export default class Questionaire extends Vue {

  @Inject()
  questionaireService: QuestionaireService;

  get currentView() {
    return this.questionaireService.currentStep;
  }

}
