import { Component } from 'vue-property-decorator';
import { OnboardingStep } from 'streamlabs-beaker';
import Multiselect from 'vue-multiselect';
import TsxComponent, { createProps } from 'components/tsx-component';
import { Inject } from 'services/core/injector';
import { ObsImporterService } from 'services/obs-importer';
import defer from 'lodash/defer';
import { $t } from 'services/i18n';
import styles from './ObsImport.m.less';

class ObsImportProps {
  continue: (bool: boolean) => void = () => {};
  setProcessing: (bool: boolean) => void = () => {};
}

@Component({ props: createProps(ObsImportProps) })
export default class ObsImport extends TsxComponent<ObsImportProps> {
  @Inject() obsImporterService: ObsImporterService;

  importing = false;
  pathChosen = false;

  sceneCollections = this.obsImporterService.getSceneCollections();

  profiles = this.obsImporterService.getProfiles();

  selectedProfile = this.profiles[0] || null;

  startImport(forceStart?: boolean) {
    if (this.importing) return;
    this.pathChosen = true;
    if (this.profiles.length > 1 && !forceStart) return;

    this.importing = true;
    this.props.setProcessing(true);
    defer(async () => {
      try {
        await this.obsImporterService.load(this.selectedProfile);
        this.importing = false;
        this.props.setProcessing(false);
        this.props.continue(true);
      } catch (e) {
        this.$toasted.show($t('Something went wrong.'), {
          position: 'bottom-center',
          className: 'toast-alert',
          duration: 3000,
        });
        this.props.setProcessing(false);
        this.importing = false;
      }
    });
  }

  render() {
    return (
      <OnboardingStep slot="2">
        <template slot="title">{$t('Welcome to Streamlabs OBS')}</template>
        <template slot="desc">
          {$t('Import your existing settings from OBS in less than a minute and go live')}
        </template>
        <div>
          {this.profiles.length > 1 && !this.importing && (
            <div>
              <span class={styles.profileSelectTitle}>{$t('Select an OBS profile to import')}</span>
              <Multiselect
                class={styles.profileSelect}
                value={this.selectedProfile}
                onInput={(val: string) => (this.selectedProfile = val)}
                options={this.profiles}
                allowEmpty={false}
                showLabels={false}
              />
              <button class="button button--action" onClick={() => this.startImport(true)}>
                {$t('Start')}
              </button>
            </div>
          )}
          {this.importing && <i class="fa fa-spinner fa-pulse" />}
        </div>
      </OnboardingStep>
    );
  }
}
