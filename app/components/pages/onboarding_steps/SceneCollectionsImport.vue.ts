import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../../services/core/injector';
import { OnboardingService } from '../../../services/onboarding';
import { SceneCollectionsService } from 'services/scene-collections';

@Component({})
export default class SceneCollectionsImport extends Vue {
  @Inject() onboardingService: OnboardingService;
  @Inject() sceneCollectionsService: SceneCollectionsService;

  get sceneCollections() {
    return this.sceneCollectionsService.collections;
  }

  next() {
    this.onboardingService.next();
  }
}
