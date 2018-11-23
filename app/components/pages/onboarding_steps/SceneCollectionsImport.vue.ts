import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../../util/injector';
import { OnboardingService } from '../../../services/onboarding';
import { Multiselect } from 'vue-multiselect';
import { ObsImporterService } from '../../../services/obs-importer';
import { defer } from 'lodash';
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
