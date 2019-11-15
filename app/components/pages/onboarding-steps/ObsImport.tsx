import { Component, Prop } from 'vue-property-decorator';
import { OnboardingStep } from 'streamlabs-beaker';
import Multiselect from 'vue-multiselect';
import TsxComponent, { createProps } from 'components/tsx-component';
import { Inject } from 'services/core/injector';
import { ObsImporterService } from 'services/obs-importer';
import defer from 'lodash/defer';
import { $t } from 'services/i18n';
import styles from './ObsImport.m.less';
import KevinSvg from './KevinSvg';
import ObsSvg from './ObsSvg';

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

  get optionsMetadata() {
    return [
      {
        title: $t('Import from OBS'),
        time: `< 1 ${$t('min')}`,
        timeColor: '--blue',
        description: $t(
          'We import all of your settings, including scenes, output, configurations, and much more',
        ),
        image: <ObsSvg />,
        onClick: () => this.startImport(),
      },
      {
        title: $t('Start Fresh'),
        time: `~2 ${$t('min')}`,
        timeColor: '--teal',
        description: $t(
          'Start with a clean copy of Streamlabs OBS and configure your settings from scratch',
        ),
        image: <KevinSvg />,
        onClick: () => this.props.continue(false),
      },
    ];
  }

  render() {
    return (
      <OnboardingStep slot="2">
        <template slot="title">{$t('Welcome to Streamlabs OBS')}</template>
        <template slot="desc">
          {$t('Import your existing settings from OBS in less than a minute and go live')}
        </template>
        {!this.pathChosen ? (
          <div style="display: flex; justify-content: space-between;">
            {this.optionsMetadata.map(data => (
              <div class={styles.optionCard} onClick={data.onClick}>
                <span
                  class={`${styles.badge} ${styles.timeBadge}`}
                  style={{ background: `var(${data.timeColor})`, color: 'white' }}
                >
                  {data.time}
                </span>
                <h2>{data.title}</h2>
                <span>{data.description}</span>
                {data.image}
              </div>
            ))}
          </div>
        ) : (
          <div>
            {this.profiles.length > 1 && !this.importing && (
              <div>
                <span class={styles.profileSelectTitle}>
                  {$t('Select an OBS profile to import')}
                </span>
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
        )}
      </OnboardingStep>
    );
  }
}
