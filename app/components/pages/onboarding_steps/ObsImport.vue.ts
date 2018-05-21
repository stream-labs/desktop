import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../../util/injector';
import { OnboardingService } from '../../../services/onboarding';
import { Multiselect } from 'vue-multiselect';
import { ObsImporterService } from '../../../services/obs-importer';
import { defer } from 'lodash';
import { SceneCollectionsService } from 'services/scene-collections';
import { $t } from 'services/i18n';

@Component({
  components: { Multiselect }
})
export default class ObsImport extends Vue {

  @Inject()
  onboardingService: OnboardingService;

  @Inject()
  obsImporterService: ObsImporterService;

  @Inject()
  sceneCollectionsService: SceneCollectionsService;

  status = 'initial';

  sceneCollections = this.obsImporterService.getSceneCollections();

  profiles = this.obsImporterService.getProfiles();

  selectedProfile = this.profiles[0] || '';

  created() {
    if (this.sceneCollections && (this.sceneCollections.length > 0)) return;
    this.startFresh();
  }

  get title() {
    if (this.status === 'importing') {
      return $t('Importing');
    }

    if (this.status === 'done') {
      return $t('Successfully Imported');
    }

    return $t('Import from OBS');
  }

  get description() {
    if (this.status === 'importing') {
      return $t('Importing your scenes and sources');
    }

    if (this.status === 'done') {
      return $t('All scenes, sources and settings have been imported.');
    }

    return $t('Import your scenes and your settings from OBS with a simple click, or start fresh.');
  }

  startImport() {
    this.status = 'importing';
    defer(async () => {
      try {
        await this.obsImporterService.load(this.selectedProfile);
        this.status = 'done';
      } catch (e) {
        // I suppose let's pretend we succeeded for now.
        this.status = 'done';
      }
    });
  }

  startFresh() {
    this.onboardingService.skip();
  }

  next() {
    this.onboardingService.next();
  }

}
